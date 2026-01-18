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
// Extracted from real production data in TEMP-sample-stream.json
const mockCpuUsagePercentValues = [
  1.125,
  1.877346683354193,
  1.7521902377972465,
  2.753441802252816,
  1.256281407035176,
  2.0075282308657463,
  1.6331658291457287,
  1.875,
  6.382978723404255,
  1.6290726817042605,
];
const mockMemoryUsagePercentValues = [
  19.630485883545305,
  19.651414939858032,
  19.62273438120726,
  19.672150208612308,
  19.65257766520874,
  19.620408930505846,
  19.746370843499108,
  19.565954626581064,
  19.6543217532348,
  19.652383877650287,
];
const mockDiskUsagePercentValues = [
  72.01446752169869,
  72.01448082296534,
  72.01449412423196,
  72.01449412423196,
  72.0145074254986,
  72.01452072676526,
  72.01638290409481,
  72.01652921802784,
  72.01654251929448,
  72.01656912182777,
];
const mockTemperatureCelsiusValues = [
  43,
  43,
  43,
  42.45,
  43.55,
  42.45,
  43.55,
  43,
  43,
  44.1,
];
const mockDiskUsedBytesValues = [
  22176178176,
  22176178176,
  22176182272,
  22176182272,
  22176186368,
  22176186368,
  22176186368,
  22176186368,
  22176190464,
  22176190464,
  22176194560,
  22176194560,
  22176768000,
  22176768000,
  22176813056,
  22176813056,
  22176817152,
  22176817152,
  22176825344,
  22176825344,
];
const mockNetworkRxBytesValues = [
  34495290,
  34526696,
  34558168,
  34589863,
  34621046,
  34652741,
  39714840,
  40092042,
  40123448,
  40217864,
];
const mockNetworkTxBytesValues = [
  3952245,
  3955838,
  3959427,
  3963092,
  3966634,
  3970309,
  4549847,
  4593084,
  4596694,
  4607479,
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
const temperatureCelsiusGenerator = createValueGenerator(mockTemperatureCelsiusValues, 0);

/**
 * Get mock host stats for development on non-Linux systems.
 */
export function getMockHostStats(): HostStats {
  const cpuUsagePercent = cpuUsagePercentGenerator.next().value!;
  const memoryUsagePercent = memoryUsagePercentGenerator.next().value!;
  const diskUsagePercent = diskUsagePercentGenerator.next().value!;
  const diskUsedBytes = diskUsedBytesGenerator.next().value!;
  // Use actual disk size from production data
  const totalBytes = 30794059776;
  const diskFreeBytes = totalBytes - diskUsedBytes;
  const memoryTotalBytes = os.totalmem();
  const memoryUsedBytes = (memoryUsagePercent / 100) * memoryTotalBytes;
  const memoryFreeBytes = memoryTotalBytes - memoryUsedBytes;
  const networkRxBytes = networkRxBytesGenerator.next().value!;
  const networkTxBytes = networkTxBytesGenerator.next().value!;
  const temperatureCelsius = temperatureCelsiusGenerator.next().value!;

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
      cpuCelsius: temperatureCelsius,
      available: true,
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
