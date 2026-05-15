import type { Readable } from 'stream';
import type { EventFilter, LogParser, ParsedLogEvent } from './types.js';

export interface WaitForEventOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export class LogAnalyzer {
  private parsers: LogParser[];
  private events: ParsedLogEvent[] = [];

  constructor(parsers: LogParser[] = []) {
    this.parsers = [...parsers];
  }

  registerParser(parser: LogParser): void {
    this.parsers.push(parser);
  }

  registerParsers(parsers: LogParser[]): void {
    this.parsers.push(...parsers);
  }

  clearEvents(): void {
    this.events = [];
  }

  getParsers(): LogParser[] {
    return [...this.parsers];
  }

  ingestLine(line: string): ParsedLogEvent[] {
    const parsed: ParsedLogEvent[] = [];

    for (const parser of this.parsers) {
      if (!parser.matches(line)) {
        continue;
      }

      const event = parser.parse(line);
      if (event) {
        this.events.push(event);
        parsed.push(event);
      }
    }

    return parsed;
  }

  ingestLines(lines: Iterable<string>): ParsedLogEvent[] {
    const parsed: ParsedLogEvent[] = [];

    for (const chunk of lines) {
      for (const line of chunk.split(/\r?\n/)) {
        if (line) {
          parsed.push(...this.ingestLine(line));
        }
      }
    }

    return parsed;
  }

  getEvents(filter: EventFilter = {}): ParsedLogEvent[] {
    return this.events.filter((event) => {
      if (filter.domain && event.domain !== filter.domain) {
        return false;
      }
      if (filter.type && event.type !== filter.type) {
        return false;
      }
      if (filter.parserId && event.parserId !== filter.parserId) {
        return false;
      }
      if (filter.predicate && !filter.predicate(event)) {
        return false;
      }
      return true;
    });
  }

  findFirst(filter: EventFilter = {}): ParsedLogEvent | undefined {
    return this.getEvents(filter)[0];
  }

  attachToStream(stream: Readable): () => void {
    const onData = (chunk: Buffer | string) => {
      const text = chunk.toString();
      const lines = text.split(/\r?\n/).filter(Boolean);
      this.ingestLines(lines);
    };

    stream.on('data', onData);
    return () => {
      stream.off('data', onData);
    };
  }

  async waitForEvent(filter: EventFilter, options: WaitForEventOptions = {}): Promise<ParsedLogEvent> {
    const timeoutMs = options.timeoutMs ?? 30000;
    const pollIntervalMs = options.pollIntervalMs ?? 100;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const found = this.findFirst(filter);
      if (found) {
        return found;
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Timeout waiting for parsed log event');
  }
}
