import type { LogParser, ParsedLogEvent } from '../types.js';

export interface RokuPerformanceEventData {
  eventName: string;
  payload: string;
  durationMs?: number;
  adjustedDurationMs?: number;
  dialogTimeMs?: number;
  phase?: string;
  metrics: Record<string, string | number>;
}

const BEACON_SIGNAL_REGEX =
  /(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+(?:sdkl|app)\s+\[beacon\.signal\]\s+\|([^\s]+)\s+[-]+>\s*(.+)$/i;

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

function parseBeaconTimestamp(timestampWithoutYear: string): number | undefined {
  const now = new Date();
  const year = now.getFullYear();

  const parsed = new Date(`${year}-${timestampWithoutYear}`);
  const value = parsed.getTime();
  return Number.isFinite(value) ? value : undefined;
}

function extractBeaconMetrics(payload: string): {
  durationMs?: number;
  adjustedDurationMs?: number;
  dialogTimeMs?: number;
  phase?: string;
} {
  const durationMatch = payload.match(/Duration\((\d+)\s*ms\s*:\s*(\d+)\s*ms\)/i);
  const dialogMatch = payload.match(/DialogTime\((\d+)\s*ms\)/i);

  const durationMs = durationMatch ? toNumber(durationMatch[1]) : undefined;
  const adjustedDurationMs = durationMatch ? toNumber(durationMatch[2]) : undefined;
  const dialogTimeMs = dialogMatch ? toNumber(dialogMatch[1]) : undefined;

  let phase: string | undefined;
  if (!durationMatch && !dialogMatch && payload.trim()) {
    phase = payload.trim();
  }

  return { durationMs, adjustedDurationMs, dialogTimeMs, phase };
}

export const rokuPerformanceParser: LogParser<RokuPerformanceEventData> = {
  id: 'roku-performance',
  domain: 'performance',
  matches(line: string): boolean {
    return line.includes('[beacon.signal]');
  },
  parse(line: string): ParsedLogEvent<RokuPerformanceEventData> | null {
    const beaconMatch = line.match(BEACON_SIGNAL_REGEX);
    if (!beaconMatch) {
      return null;
    }

    const [, tsWithoutYear, beaconEventName, payload] = beaconMatch;

    const { durationMs, adjustedDurationMs, dialogTimeMs, phase } = extractBeaconMetrics(payload);
    const metrics: Record<string, string | number> = {};
    if (durationMs !== undefined) metrics.durationMs = durationMs;
    if (adjustedDurationMs !== undefined) metrics.adjustedDurationMs = adjustedDurationMs;
    if (dialogTimeMs !== undefined) metrics.dialogTimeMs = dialogTimeMs;
    if (phase) metrics.phase = phase;

    return {
      parserId: 'roku-performance',
      domain: 'performance',
      type: beaconEventName,
      raw: line,
      timestampMs: parseBeaconTimestamp(tsWithoutYear),
      data: {
        eventName: beaconEventName,
        payload,
        durationMs,
        adjustedDurationMs,
        dialogTimeMs,
        phase,
        metrics,
      },
    };
  },
};
