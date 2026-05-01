import { Socket } from 'net';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { createWriteStream, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { log } from './utils.js';

const ROKU_TELNET_PORT = 8085;

export interface TelnetLoggerOptions {
  /** The host/IP address of the Roku device. Defaults to ROKU_IP env variable. */
  host?: string;
  /** The telnet port to connect to. Defaults to 8085. */
  port?: number;
  /** Buffer size before flushing output (in bytes). Defaults to 4096. */
  bufferSize?: number;
  /** Flush interval in milliseconds. Defaults to 100ms. */
  flushInterval?: number;
  /**
   * Directory to write log files into. Each session creates a timestamped file.
   * Pass `false` to disable file logging (default). Pass `true` to use `./logs`.
   */
  logDir?: string | boolean;
  /** Custom log filename. Defaults to `roku-<timestamp>.log`. */
  logFileName?: string;
}

export interface TelnetLoggerEvents {
  /** Emitted when console output is received from the Roku */
  'console-output': (output: string) => void;
  /** Emitted when connected to the Roku telnet */
  'connected': () => void;
  /** Emitted when disconnected from the Roku telnet */
  'disconnected': () => void;
  /** Emitted when an error occurs */
  'error': (error: Error) => void;
}

/**
 * A telnet client for capturing logs from a Roku device.
 * Connects to the Roku's debug console on port 8085 and emits log output as events.
 * Logs can be written to a session file and/or consumed as Node.js Readable streams.
 *
 * Intended usage with WDIO hooks:
 * ```typescript
 * // wdio.conf.ts
 * const logger = new RokuTelnetLogger({ logDir: './logs' });
 *
 * before: async () => { await logger.connect(); }
 * beforeTest: () => { logger.startCapture(); }
 * afterTest: async (test) => {
 *   const content = await logger.stopCapture(`./logs/${test.title}.log`);
 *   if (test.passed === false) console.log(content);
 * }
 * after: async () => { await logger.disconnect(); }
 * ```
 */
export class RokuTelnetLogger extends EventEmitter {
  private socket: Socket | null = null;
  private host: string;
  private port: number;
  private bufferSize: number;
  private flushInterval: number;
  private buffer: string = '';
  private flushTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  /** Lines collected between startCapture() and stopCapture(). null when not capturing. */
  private captureLines: string[] | null = null;
  /** Active consumer streams created via createLogStream(), closed on disconnect. */
  private logStreamConsumers: Set<PassThrough> = new Set();
  /** Writable stream to the session log file, if logDir was provided. */
  private fileStream: ReturnType<typeof createWriteStream> | null = null;
  /** Path to the active session log file. */
  public logFilePath: string | null = null;

  constructor(options: TelnetLoggerOptions = {}) {
    super();
    this.host = options.host || process.env.ROKU_IP || '';
    this.port = options.port || ROKU_TELNET_PORT;
    this.bufferSize = options.bufferSize || 4096;
    this.flushInterval = options.flushInterval || 100;

    if (!this.host) {
      throw new Error('Roku host is required. Set ROKU_IP environment variable or pass host option.');
    }

    if (options.logDir) {
      const dir = options.logDir === true ? './logs' : options.logDir;
      mkdirSync(dir, { recursive: true });
      const fileName = options.logFileName ?? `roku-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
      this.logFilePath = join(dir, fileName);
      this.fileStream = createWriteStream(this.logFilePath, { encoding: 'utf-8', flags: 'a' });
      log.debug(`Session logging to file: ${this.logFilePath}`);
    }
  }

  // Type-safe event emitter methods
  on<K extends keyof TelnetLoggerEvents>(event: K, listener: TelnetLoggerEvents[K]): this {
    return super.on(event, listener);
  }

  once<K extends keyof TelnetLoggerEvents>(event: K, listener: TelnetLoggerEvents[K]): this {
    return super.once(event, listener);
  }

  off<K extends keyof TelnetLoggerEvents>(event: K, listener: TelnetLoggerEvents[K]): this {
    return super.off(event, listener);
  }

  emit<K extends keyof TelnetLoggerEvents>(event: K, ...args: Parameters<TelnetLoggerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Connect to the Roku device's telnet debug console.
   *
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      log.debug('Already connected to Roku telnet');
      return;
    }

    return new Promise((resolve, reject) => {
      this.socket = new Socket();

      const connectTimeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error(`Telnet connection timeout to ${this.host}:${this.port}`));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(connectTimeout);
        this.isConnected = true;
        this.startFlushTimer();
        log.debug(`Connected to Roku telnet at ${this.host}:${this.port}`);
        this.emit('connected');
        resolve();
      });

      this.socket.on('data', (data: Buffer) => {
        this.handleData(data);
      });

      this.socket.on('close', () => {
        this.handleDisconnect();
      });

      this.socket.on('error', (err: Error) => {
        clearTimeout(connectTimeout);
        log.debug(`Telnet error: ${err.message}`);
        this.emit('error', err);
        if (!this.isConnected) {
          reject(err);
        }
      });

      log.debug(`Connecting to Roku telnet at ${this.host}:${this.port}`);
      this.socket.connect(this.port, this.host);
    });
  }

  /**
   * Disconnect from the Roku device's telnet debug console.
   *
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.socket) {
      return;
    }

    return new Promise((resolve) => {
      // handleDisconnect is already wired to socket 'close' — wait for it, then resolve.
      this.once('disconnected', resolve);
      this.flushBuffer();
      this.stopFlushTimer();
      this.socket!.destroy();
      this.isConnected = false;
    });
  }

  /**
   * Check if currently connected to the Roku telnet.
   *
   * @returns True if connected, false otherwise
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Returns an independent Readable stream of log lines (utf-8, one line per chunk).
   * Each call creates a new stream so multiple consumers can filter independently
   * without interfering with each other's backpressure.
   * Call `stream.destroy()` when you no longer need the stream.
   *
   * @example
   * ```typescript
   * const beacons = logger.createLogStream();
   * beacons.on('data', (line: string) => {
   *   if (line.includes('AppMeasurement')) console.log('Beacon:', line);
   * });
   * // In afterTest:
   * beacons.destroy();
   * ```
   */
  createLogStream(): PassThrough {
    const consumer = new PassThrough({ objectMode: false });
    consumer.setEncoding('utf-8');
    this.logStreamConsumers.add(consumer);

    const handler = (line: string) => {
      if (!consumer.destroyed) {
        consumer.push(line + '\n');
      }
    };
    this.on('console-output', handler);

    consumer.once('close', () => {
      this.off('console-output', handler);
      this.logStreamConsumers.delete(consumer);
    });

    return consumer;
  }

  /**
   * Begin collecting logs for the current test. Call this in a `beforeTest` hook.
   * Replaces any previously active capture.
   */
  startCapture(): void {
    this.captureLines = [];
    log.debug('Per-test capture started');
  }

  /**
   * Stop collecting logs and optionally write them to a file. Call this in an `afterTest` hook.
   * Returns the collected log content as a string regardless of whether a file path is given.
   *
   * @param filePath - Optional path to write the captured logs to. Parent directories are created automatically.
   * @returns The captured log content
   *
   * @example
   * ```typescript
   * afterTest: async (test) => {
   *   const logs = await logger.stopCapture(`./logs/${test.title}.log`);
   *   if (!test.passed) console.log(logs);
   * }
   * ```
   */
  async stopCapture(filePath?: string): Promise<string> {
    const lines = this.captureLines ?? [];
    this.captureLines = null;
    const content = lines.join('\n');

    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, 'utf-8');
      log.debug(`Per-test capture written to: ${filePath}`);
    }

    log.debug('Per-test capture stopped');
    return content;
  }

  /**
   * Wait for a specific pattern to appear in the logs.
   *
   * @param pattern - String or RegExp to match against log output
   * @param timeout - Maximum time to wait in milliseconds (default: 30000)
   * @returns Promise that resolves with the matching log line, or rejects on timeout
   */
  async waitForLog(pattern: string | RegExp, timeout: number = 30000): Promise<string> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off('console-output', handler);
        reject(new Error(`Timeout waiting for log pattern: ${pattern}`));
      }, timeout);

      const handler = (output: string) => {
        if (regex.test(output)) {
          clearTimeout(timeoutId);
          this.off('console-output', handler);
          resolve(output);
        }
      };

      this.on('console-output', handler);
    });
  }

  /**
   * Send a command to the Roku debug console.
   *
   * @param command - The command to send (e.g., 'bt' for backtrace)
   */
  sendCommand(command: string): void {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to Roku telnet');
    }

    this.socket.write(command + '\r\n');
    log.debug(`Sent command: ${command}`);
  }

  private handleData(data: Buffer): void {
    const text = data.toString('utf-8');
    this.buffer += text;

    // Flush if buffer exceeds size limit
    if (this.buffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  private flushBuffer(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const lines = this.buffer.split(/\r?\n/);

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        const chunk = line + '\n';
        this.fileStream?.write(chunk);
        if (this.captureLines !== null) {
          this.captureLines.push(line);
        }
        this.emit('console-output', line);
      }
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private handleDisconnect(): void {
    this.flushBuffer();
    this.stopFlushTimer();

    // End all active log stream consumers
    for (const consumer of this.logStreamConsumers) {
      consumer.push(null);
    }
    this.logStreamConsumers.clear();

    if (this.fileStream) {
      this.fileStream.end(() => {
        this.fileStream = null;
      });
    }

    this.isConnected = false;
    this.socket = null;
    this.emit('disconnected');
    log.debug('Roku telnet connection closed');
  }
}

/**
 * Create a RokuTelnetLogger instance and connect to the Roku device.
 * This is a convenience function for quick setup.
 *
 * @param options - Telnet logger options
 * @returns Promise that resolves with a connected RokuTelnetLogger instance
 *
 * @example
 * ```typescript
 * import { connectTelnet } from 'wdio-roku-service/telnet';
 *
 * const logger = await connectTelnet({ host: '192.168.1.100', logDir: './logs' });
 *
 * // Pipe to a custom filter stream
 * const stream = logger.createLogStream();
 * stream.on('data', (line: string) => {
 *   if (line.includes('beacon')) console.log('Beacon hit:', line);
 * });
 *
 * // ... run tests ...
 * await logger.disconnect();
 * ```
 */
export async function connectTelnet(options?: TelnetLoggerOptions): Promise<RokuTelnetLogger> {
  const logger = new RokuTelnetLogger(options);
  await logger.connect();
  return logger;
}

export default RokuTelnetLogger;
