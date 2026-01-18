import type { DiskStats, HostStats } from "@pi-site/shared/types.js";
import fs from "fs/promises";
import os from "os";
import { config } from "../config.js";
import {
  calculateCpuUsage,
  parseCpuCount,
  parseCpuTemperature,
  parseCpuTimes,
  parseKernelVersion,
  parseLoadavg,
  parseMeminfo,
  parseNetDev,
  parseUptime,
  type CpuTimes,
} from "../utils/proc-parser.js";

// Store previous CPU times for calculating usage percentage
let prevCpuTimes: CpuTimes | null = null;

/**
 * Get disk stats using statfs.
 */
async function getDiskStats(
  mountPoint: string,
  path: string
): Promise<DiskStats | null> {
  try {
    const stats = await fs.statfs(path);
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bfree * stats.bsize;
    const usedBytes = totalBytes - freeBytes;

    return {
      mountPoint,
      totalBytes,
      usedBytes,
      freeBytes,
      usagePercent: totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get real host stats from /proc and /sys.
 */
export async function getHostStats(): Promise<HostStats> {
  // Gather all data in parallel
  const [
    meminfo,
    loadavg,
    uptime,
    cpuTimes,
    netDev,
    temperature,
    kernelVersion,
    cpuCount,
    rootDisk,
    dockerDisk,
  ] = await Promise.all([
    parseMeminfo(),
    parseLoadavg(),
    parseUptime(),
    parseCpuTimes(),
    parseNetDev(),
    parseCpuTemperature(),
    parseKernelVersion(),
    parseCpuCount(),
    getDiskStats("/", config.paths.rootFs),
    getDiskStats("/var/lib/docker", config.paths.dockerVolumes),
  ]);

  // Calculate CPU usage from delta
  let cpuUsagePercent = 0;
  if (cpuTimes) {
    if (prevCpuTimes) {
      cpuUsagePercent = calculateCpuUsage(prevCpuTimes, cpuTimes);
    }
    prevCpuTimes = cpuTimes;
  }

  // Build disk array
  const disks: DiskStats[] = [];
  if (rootDisk) disks.push(rootDisk);
  if (dockerDisk) disks.push(dockerDisk);

  // Fallback values for when /proc isn't available
  const fallbackCores = os.cpus().length;
  const fallbackLoadavg = os.loadavg() as [number, number, number];
  const fallbackUptime = os.uptime();
  const fallbackTotalMem = os.totalmem();
  const fallbackFreeMem = os.freemem();

  return {
    cpu: {
      usagePercent: cpuUsagePercent,
      loadAverage: loadavg ?? fallbackLoadavg,
      cores: cpuCount ?? fallbackCores,
    },
    memory: {
      totalBytes: meminfo?.MemTotal ?? fallbackTotalMem,
      usedBytes:
        meminfo && meminfo.MemTotal && meminfo.MemAvailable
          ? meminfo.MemTotal - meminfo.MemAvailable
          : fallbackTotalMem - fallbackFreeMem,
      freeBytes: meminfo?.MemFree ?? fallbackFreeMem,
      availableBytes: meminfo?.MemAvailable ?? fallbackFreeMem,
      usagePercent:
        meminfo && meminfo.MemTotal && meminfo.MemAvailable
          ? ((meminfo.MemTotal - meminfo.MemAvailable) / meminfo.MemTotal) * 100
          : ((fallbackTotalMem - fallbackFreeMem) / fallbackTotalMem) * 100,
    },
    disks:
      disks.length > 0
        ? disks
        : [
            {
              mountPoint: "/",
              totalBytes: 0,
              usedBytes: 0,
              freeBytes: 0,
              usagePercent: 0,
            },
          ],
    temperature: {
      cpuCelsius: temperature,
      available: temperature !== null,
    },
    network: {
      interfaces:
        netDev && netDev.length > 0
          ? netDev
          : [{ name: "unknown", rxBytes: 0, txBytes: 0 }],
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: uptime ?? fallbackUptime,
      kernelVersion,
    },
  };
}

/**
 * Get mock host stats for development on non-Linux systems.
 */
export function getMockHostStats(): HostStats {
  return {
    cpu: {
      usagePercent: 25.5,
      loadAverage: os.loadavg() as [number, number, number],
      cores: os.cpus().length,
    },
    memory: {
      totalBytes: os.totalmem(),
      usedBytes: os.totalmem() - os.freemem(),
      freeBytes: os.freemem(),
      availableBytes: os.freemem(),
      usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    disks: [
      {
        mountPoint: "/",
        totalBytes: 100 * 1024 * 1024 * 1024,
        usedBytes: 50 * 1024 * 1024 * 1024,
        freeBytes: 50 * 1024 * 1024 * 1024,
        usagePercent: 50,
      },
    ],
    temperature: {
      cpuCelsius: null,
      available: false,
    },
    network: {
      interfaces: [
        { name: "eth0", rxBytes: 1024 * 1024 * 100, txBytes: 1024 * 1024 * 50 },
      ],
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: os.uptime(),
      kernelVersion: null,
    },
  };
}

/**
 * Get host stats - uses real data on Linux, mock data otherwise.
 */
export async function collectHostStats(): Promise<HostStats> {
  if (config.mockHostStats) {
    return getMockHostStats();
  }
  return getHostStats();
}
