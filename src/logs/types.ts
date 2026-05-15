export interface ParsedLogEvent<TData = unknown> {
  /** Parser identifier, e.g. `roku-performance` */
  parserId: string;
  /** Event domain, e.g. `performance` or `analytics` */
  domain: string;
  /** Event type within the domain */
  type: string;
  /** Original raw log line */
  raw: string;
  /** Parsed structured payload */
  data: TData;
  /** Parsed timestamp in epoch milliseconds when available */
  timestampMs?: number;
}

export interface LogParser<TData = unknown> {
  /** Stable parser identifier */
  id: string;
  /** Domain this parser emits events for */
  domain: string;
  /** Fast pre-check to avoid unnecessary parsing */
  matches(line: string): boolean;
  /** Parse a line into a structured event, or null if not parsable */
  parse(line: string): ParsedLogEvent<TData> | null;
}

export interface EventFilter {
  domain?: string;
  type?: string;
  parserId?: string;
  predicate?: (event: ParsedLogEvent) => boolean;
}
