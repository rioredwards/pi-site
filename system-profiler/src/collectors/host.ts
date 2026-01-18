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

// Arrays of values to cycle through for varying mock data
const mockCpuUsagePercentValues = [25.5, 26.2, 24.8, 27.1, 25.0, 26.5];
const mockMemoryUsagePercentValues = [45.2, 46.8, 44.1, 47.5, 45.0, 46.3];
const mockDiskUsagePercentValues = [50, 52.3, 48.7, 53.1, 49.5, 51.8];
const mockDiskUsedBytesValues = [
  50 * 1024 * 1024 * 1024,
  52.3 * 1024 * 1024 * 1024,
  48.7 * 1024 * 1024 * 1024,
  53.1 * 1024 * 1024 * 1024,
  49.5 * 1024 * 1024 * 1024,
  51.8 * 1024 * 1024 * 1024,
];
const mockNetworkRxBytesValues = [
  1024 * 1024 * 100,
  1024 * 1024 * 105,
  1024 * 1024 * 98,
  1024 * 1024 * 110,
  1024 * 1024 * 102,
  1024 * 1024 * 108,
];
const mockNetworkTxBytesValues = [
  1024 * 1024 * 50,
  1024 * 1024 * 52,
  1024 * 1024 * 48,
  1024 * 1024 * 55,
  1024 * 1024 * 51,
  1024 * 1024 * 53,
];

// Generator function that cycles through an array with an offset
function* createValueGenerator<T>(values: T[], offset: number): Generator<T> {
  let index = offset % values.length;
  while (true) {
    yield values[index];
    index = (index + 1) % values.length;
  }
}

// Create generators for each varying parameter
const cpuUsagePercentGenerator = createValueGenerator(mockCpuUsagePercentValues, 0);
const memoryUsagePercentGenerator = createValueGenerator(mockMemoryUsagePercentValues, 1);
const diskUsagePercentGenerator = createValueGenerator(mockDiskUsagePercentValues, 2);
const diskUsedBytesGenerator = createValueGenerator(mockDiskUsedBytesValues, 2);
const networkRxBytesGenerator = createValueGenerator(mockNetworkRxBytesValues, 0);
const networkTxBytesGenerator = createValueGenerator(mockNetworkTxBytesValues, 1);

/**
 * Get mock host stats for development on non-Linux systems.
 */
export function getMockHostStats(): HostStats {
  const cpuUsagePercent = cpuUsagePercentGenerator.next().value!;
  const memoryUsagePercent = memoryUsagePercentGenerator.next().value!;
  const diskUsagePercent = diskUsagePercentGenerator.next().value!;
  const diskUsedBytes = diskUsedBytesGenerator.next().value!;
  const totalBytes = 100 * 1024 * 1024 * 1024;
  const diskFreeBytes = totalBytes - diskUsedBytes;
  const memoryTotalBytes = os.totalmem();
  const memoryUsedBytes = (memoryUsagePercent / 100) * memoryTotalBytes;
  const memoryFreeBytes = memoryTotalBytes - memoryUsedBytes;
  const networkRxBytes = networkRxBytesGenerator.next().value!;
  const networkTxBytes = networkTxBytesGenerator.next().value!;

  return {
    cpu: {
      usagePercent: cpuUsagePercent,
      loadAverage: os.loadavg() as [number, number, number],
      cores: os.cpus().length,
    },
    memory: {
      totalBytes: memoryTotalBytes,
      usedBytes: memoryUsedBytes,
      freeBytes: memoryFreeBytes,
      availableBytes: memoryFreeBytes,
      usagePercent: memoryUsagePercent,
    },
    disks: [
      {
        mountPoint: "/",
        totalBytes,
        usedBytes: diskUsedBytes,
        freeBytes: diskFreeBytes,
        usagePercent: diskUsagePercent,
      },
    ],
    temperature: {
      cpuCelsius: null,
      available: false,
    },
    network: {
      interfaces: [
        { name: "eth0", rxBytes: networkRxBytes, txBytes: networkTxBytes },
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
