/* eslint-disable @typescript-eslint/no-namespace */
import RokuWorkerService from './service.js';
import type { WaitForOptions } from 'webdriverio';

export default RokuWorkerService;
export { RokuTelnetLogger, connectTelnet } from './telnet.js';
export type { TelnetLoggerOptions, TelnetLoggerEvents } from './telnet.js';
export {
  LogAnalyzer,
  createLogAnalyzer,
  builtInLogParsers,
  rokuPerformanceParser,
} from './logs/index.js';
export type {
  WaitForEventOptions,
  ParsedLogEvent,
  LogParser,
  EventFilter,
  RokuPerformanceEventData,
} from './logs/index.js';

declare global {
  namespace WebdriverIO {
    interface Browser {
      /**
       * Downloads the XML of the current UI from the Roku, writes it to a temporary file, then opens that in the browser.
       * This will not automatically update, you must call this any time there are changes.
       * @returns The result from browser.url()
       */
      openRokuXML: () => Promise<void | WebdriverIO.Request>;
    }
    interface Element {
      /**
       * Waits for an element to become focused (or unfocused, if `reverse` is set), based on the `focused` attribute.
       * @param options WaitForOptions (timeout, interval, reverse, timeoutMsg)
       */
      waitForFocused: (options?: WaitForOptions) => Promise<boolean>;
    }
  }
  namespace NodeJS {
    interface ProcessEnv {
      /** The IP address of the Roku to communicate with. */
      ROKU_IP: string;
      /** The username to authenticate with for installing or taking screenshots. */
      ROKU_USER?: string;
      /** The password to authenticate with for installing or taking screenshots. */
      ROKU_PW?: string;
    }
  }
}
