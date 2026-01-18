import fs from "fs/promises";
import { config } from "../config.js";

/**
 * Safely read a file, returning null if it doesn't exist or can't be read.
 */
async function readFile(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Parse /proc/meminfo into a key-value object.
 * Values are in bytes (converted from kB).
 */
export async function parseMeminfo(): Promise<Record<string, number> | null> {
  const content = await readFile(`${config.paths.proc}/meminfo`);
  if (!content) return null;

  const result: Record<string, number> = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^(\w+):\s+(\d+)\s*kB?/);
    if (match) {
      // Convert kB to bytes
      result[match[1]] = parseInt(match[2], 10) * 1024;
    }
  }
  return result;
}

/**
 * Parse /proc/loadavg.
 * Returns [1min, 5min, 15min] load averages.
 */
export async function parseLoadavg(): Promise<[number, number, number] | null> {
  const content = await readFile(`${config.paths.proc}/loadavg`);
  if (!content) return null;

  const parts = content.trim().split(/\s+/);
  if (parts.length < 3) return null;

  return [
    parseFloat(parts[0]),
    parseFloat(parts[1]),
    parseFloat(parts[2]),
  ];
}

/**
 * Parse /proc/uptime.
 * Returns uptime in seconds.
 */
export async function parseUptime(): Promise<number | null> {
  const content = await readFile(`${config.paths.proc}/uptime`);
  if (!content) return null;

  const parts = content.trim().split(/\s+/);
  if (parts.length < 1) return null;

  return parseFloat(parts[0]);
}

/**
 * CPU time snapshot from /proc/stat.
 */
export interface CpuTimes {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  total: number;
}

/**
 * Parse /proc/stat for CPU times.
 * Returns the aggregate CPU line (cpu) times.
 */
export async function parseCpuTimes(): Promise<CpuTimes | null> {
  const content = await readFile(`${config.paths.proc}/stat`);
  if (!content) return null;

  // Find the aggregate cpu line (not cpu0, cpu1, etc.)
  const cpuLine = content.split("\n").find((line) => line.startsWith("cpu "));
  if (!cpuLine) return null;

  const parts = cpuLine.split(/\s+/).slice(1).map(Number);
  if (parts.length < 8) return null;

  const [user, nice, system, idle, iowait, irq, softirq, steal] = parts;
  const total = user + nice + system + idle + iowait + irq + softirq + steal;

  return { user, nice, system, idle, iowait, irq, softirq, steal, total };
}

/**
 * Calculate CPU usage percentage from two snapshots.
 */
export function calculateCpuUsage(prev: CpuTimes, curr: CpuTimes): number {
  const totalDelta = curr.total - prev.total;
  const idleDelta = curr.idle - prev.idle;

  if (totalDelta === 0) return 0;

  return ((totalDelta - idleDelta) / totalDelta) * 100;
}

/**
 * Network interface stats from /proc/net/dev.
 */
export interface NetDevStats {
  name: string;
  rxBytes: number;
  txBytes: number;
}

/**
 * Parse /proc/net/dev for network interface stats.
 */
export async function parseNetDev(): Promise<NetDevStats[] | null> {
  const content = await readFile(`${config.paths.proc}/net/dev`);
  if (!content) return null;

  const lines = content.split("\n").slice(2); // Skip header lines
  const interfaces: NetDevStats[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*(\w+):\s*(\d+)(?:\s+\d+){7}\s+(\d+)/);
    if (match) {
      const name = match[1];
      // Skip loopback
      if (name === "lo") continue;

      interfaces.push({
        name,
        rxBytes: parseInt(match[2], 10),
        txBytes: parseInt(match[3], 10),
      });
    }
  }

  return interfaces;
}

/**
 * Read CPU temperature from thermal zone (Raspberry Pi).
 * Returns temperature in Celsius or null if not available.
 */
export async function parseCpuTemperature(): Promise<number | null> {
  const content = await readFile(
    `${config.paths.sys}/class/thermal/thermal_zone0/temp`
  );
  if (!content) return null;

  const temp = parseInt(content.trim(), 10);
  if (isNaN(temp)) return null;

  // Temperature is in millidegrees Celsius
  return temp / 1000;
}

/**
 * Read kernel version from /proc/version.
 */
export async function parseKernelVersion(): Promise<string | null> {
  const content = await readFile(`${config.paths.proc}/version`);
  if (!content) return null;

  // Extract version like "5.15.0-1234-generic"
  const match = content.match(/Linux version (\S+)/);
  return match ? match[1] : null;
}

/**
 * Get CPU core count from /proc/cpuinfo.
 */
export async function parseCpuCount(): Promise<number | null> {
  const content = await readFile(`${config.paths.proc}/cpuinfo`);
  if (!content) return null;

  const matches = content.match(/^processor\s*:/gm);
  return matches ? matches.length : null;
}
