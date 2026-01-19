export type HistoryPoint = {
  t: number; // epoch ms
  label: string; // e.g. "12:34:56"
  cpu: number;
  mem: number;
  temp: number | null;
  rxRate: number | null; // bytes/sec
  txRate: number | null; // bytes/sec
};

export const HISTORY_MAX = 42;

export type Tone = "good" | "warn" | "bad" | "neutral";
