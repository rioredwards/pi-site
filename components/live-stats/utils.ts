export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return null;
  return clamp(n, 0, 100);
}

export function formatPercent(n: number | null | undefined, digits = 1) {
  const p = pct(n);
  if (p == null) return "—";
  return `${p.toFixed(digits)}%`;
}

export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 ? 0 : i === 1 ? 0 : 1;
  return `${v.toFixed(digits)} ${units[i]}`;
}

export function formatBps(bytesPerSec: number | null | undefined) {
  if (bytesPerSec == null || Number.isNaN(bytesPerSec)) return "—";
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatUptime(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts = [
    days ? `${days}d` : null,
    hrs ? `${hrs}h` : null,
    mins ? `${mins}m` : null,
    `${secs}s`,
  ].filter(Boolean);
  return parts.join(" ");
}

export function formatTimeLabel(epochMs: number) {
  const d = new Date(epochMs);
  return d.toLocaleTimeString([], { hour12: false });
}
