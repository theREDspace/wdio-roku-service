import { LogAnalyzer } from './analyzer.js';
import { builtInLogParsers } from './parsers/index.js';

export { LogAnalyzer };
export type { WaitForEventOptions } from './analyzer.js';
export type { ParsedLogEvent, LogParser, EventFilter } from './types.js';
export { builtInLogParsers, rokuPerformanceParser } from './parsers/index.js';
export type { RokuPerformanceEventData } from './parsers/rokuPerformance.js';

export function createLogAnalyzer() {
  return new LogAnalyzer(builtInLogParsers);
}
