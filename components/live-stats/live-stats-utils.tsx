
/**
 * Parse the timestamp from the effective stats object.
 * @param effective - The effective stats object.
 * @returns The timestamp in milliseconds, or null if the timestamp is invalid.
 */
export function parseEffectiveTimestamp(effective: any): number | null {
  if (!effective) return null;
  const t = Date.parse(effective.timestamp ?? "");
  return Number.isFinite(t) ? t : null;
}

/**
 * Get the age of the effective stats object in seconds.
 * @param timestamp - The timestamp in milliseconds.
 * @param nowMs - The current time in milliseconds.
 * @returns The age in seconds, or null if the timestamp is invalid.
 */
export function getAgeSeconds(timestamp: number, nowMs: number) {
  return Math.max(0, (nowMs - timestamp) / 1000);
}

export type Tone = "good" | "warn" | "bad" | "neutral";

/**
 * Get the freshness tone based on the age of the effective stats object.
 * @param connected - Whether the connection is established.
 * @param ageSeconds - The age of the effective stats object in seconds.
 * @returns The freshness tone.
 */
export function getFreshnessTone(connected: boolean, ageSeconds: number): Tone {
  if (!connected) return "bad";
  if (ageSeconds == null) return "neutral";
  if (ageSeconds < 3) return "good";
  if (ageSeconds < 8) return "warn";
  return "bad";
}
