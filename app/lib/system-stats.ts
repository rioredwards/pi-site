import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import * as os from "os";
import { devLog } from "./utils";

type SystemInfoResponse = {
  message: string;
  stats: {
    platform: string;
    architecture: string;
  };
};

// Types for system statistics
export interface StaticSystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryGB: number;
  totalDiskGB: number;
  osName: string;
  osVersion: string;
  kernelVersion: string;
  piModel: string | null;
}

export interface LiveSystemStats {
  cpuUsagePercent: number;
  memoryUsedPercent: number;
  memoryUsedGB: number;
  cpuTempCelsius: number | null;
  loadAverage: [number, number, number];
  uptimeSeconds: number;
  uptimeFormatted: string;
  timestamp: number;
}

const SYSTEM_PROFILER_BASE_URL = process.env.SYSTEM_PROFILER_BASE_URL!;

if (!SYSTEM_PROFILER_BASE_URL) {
  throw new Error("SYSTEM_PROFILER_BASE_URL is not set");
}

// Helper to safely read a file
function safeReadFile(path: string): string | null {
  try {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8").trim();
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// Parse OS release info in a platform-agnostic way
function getOsRelease(): { name: string; version: string } {
  const platform = os.platform();

  if (platform === "linux") {
    const content = safeReadFile("/etc/os-release");
    if (!content) {
      return { name: os.type(), version: os.release() };
    }

    const lines = content.split("\n");
    let name = os.type();
    let version = "";

    for (const line of lines) {
      if (line.startsWith("PRETTY_NAME=")) {
        name = line.split("=")[1]?.replace(/"/g, "") || name;
      }
      if (line.startsWith("VERSION=")) {
        version = line.split("=")[1]?.replace(/"/g, "") || version;
      }
    }

    return { name, version };
  } else if (platform === "darwin") {
    try {
      // Use sw_vers command for macOS
      const productName = execSync("sw_vers -productName", { encoding: "utf-8" }).trim();
      const productVersion = execSync("sw_vers -productVersion", { encoding: "utf-8" }).trim();
      return { name: productName, version: productVersion };
    } catch {
      return { name: os.type(), version: os.release() };
    }
  }

  // Fallback for other platforms
  return { name: os.type(), version: os.release() };
}

// Get Raspberry Pi model (Linux only)
function getPiModel(): string | null {
  if (os.platform() !== "linux") {
    return null;
  }

  const model = safeReadFile("/proc/device-tree/model");
  if (model) {
    // Remove null bytes that sometimes appear
    return model.replace(/\0/g, "").trim();
  }
  return null;
}

// Get CPU temperature
function getCpuTemp(): number | null {
  const platform = os.platform();

  if (platform === "linux") {
    // Try Raspberry Pi thermal zone
    const temp = safeReadFile("/sys/class/thermal/thermal_zone0/temp");
    if (temp) {
      const milliCelsius = parseInt(temp, 10);
      if (!isNaN(milliCelsius)) {
        return Math.round((milliCelsius / 1000) * 10) / 10; // Round to 1 decimal
      }
    }
  } else if (platform === "darwin") {
    try {
      // Use powermetrics for macOS CPU temperature
      const output = execSync(
        "sudo powermetrics --samplers smc -n1 -i1000 | grep -E 'CPU die temperature:' | awk '{print $4}'",
        {
          encoding: "utf-8",
        }
      );
      const temp = parseFloat(output.trim());
      if (!isNaN(temp)) {
        return Math.round(temp * 10) / 10; // Round to 1 decimal
      }
    } catch {
      // powermetrics requires sudo, fallback to null
    }
  }

  return null;
}

// Get total disk space for root partition
function getTotalDiskGB(): number {
  try {
    // Use platform-appropriate df command
    const platform = os.platform();
    let command: string;

    if (platform === "darwin") {
      // macOS df output format might differ slightly
      command = "df -k / 2>/dev/null | tail -1 | awk '{print $2}'";
    } else {
      // Linux and others
      command = "df -B1 / 2>/dev/null | tail -1 | awk '{print $2}'";
    }

    const output = execSync(command, { encoding: "utf-8" });
    let bytes = parseInt(output.trim(), 10);

    // If using -k flag, convert from KB to bytes
    if (platform === "darwin" && !isNaN(bytes)) {
      bytes *= 1024;
    }

    if (!isNaN(bytes)) {
      return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10;
    }
  } catch {
    // Fallback
  }
  return 0;
}

// Store previous CPU times for calculating usage
let prevCpuTimes: { idle: number; total: number } | null = null;

// Get CPU usage percentage
function getCpuUsage(): number {
  const platform = os.platform();

  if (platform === "linux") {
    const statContent = safeReadFile("/proc/stat");
    if (!statContent) {
      // Fallback: use os.loadavg as rough approximation
      const load = os.loadavg()[0];
      const cpus = os.cpus().length;
      return Math.min(Math.round((load / cpus) * 100), 100);
    }

    const cpuLine = statContent.split("\n").find((line) => line.startsWith("cpu "));
    if (!cpuLine) return 0;

    const parts = cpuLine.split(/\s+/).slice(1).map(Number);
    const idle = parts[3] + (parts[4] || 0); // idle + iowait
    const total = parts.reduce((a, b) => a + b, 0);

    if (!prevCpuTimes) {
      prevCpuTimes = { idle, total };
      return 0;
    }

    const idleDelta = idle - prevCpuTimes.idle;
    const totalDelta = total - prevCpuTimes.total;

    prevCpuTimes = { idle, total };

    if (totalDelta === 0) return 0;

    const usage = ((totalDelta - idleDelta) / totalDelta) * 100;
    return Math.round(usage * 10) / 10;
  } else if (platform === "darwin") {
    try {
      // Use sysctl for macOS CPU usage
      const output = execSync("ps -A -o %cpu | awk '{s+=$1} END {print s}'", {
        encoding: "utf-8",
      });
      const usage = parseFloat(output.trim());
      if (!isNaN(usage)) {
        return Math.round(usage * 10) / 10;
      }
    } catch {
      // Fallback to load average
    }
  }

  // Fallback: use os.loadavg as rough approximation for any platform
  const load = os.loadavg()[0];
  const cpus = os.cpus().length;
  return Math.min(Math.round((load / cpus) * 100), 100);
}

// Format uptime into human readable string
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(" ") : "< 1m";
}

// Get static system information (called once, can be cached)
export async function getStaticSystemInfo(): Promise<StaticSystemInfo> {
  console.log("SYSTEM_PROFILER_BASE_URL: ", SYSTEM_PROFILER_BASE_URL);
  const url = `${SYSTEM_PROFILER_BASE_URL}/debug/stats`;
  console.log("url: ", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch system stats: ${response.statusText}`);
  }

  const data = (await response.json()) as SystemInfoResponse;

  devLog("⚙️ system-stats data: ", data);

  if (data.message !== "System stats") {
    throw new Error(`Invalid response from system stats: ${data.message}`);
  }

  const { platform, architecture } = data.stats;

  const cpus = os.cpus();
  const osRelease = getOsRelease();

  return {
    hostname: "raspberry-pi", // Sanitized - don't expose real hostname
    platform: platform,
    arch: architecture,
    cpuModel: cpus[0]?.model?.trim() || "Unknown",
    cpuCores: cpus.length,
    totalMemoryGB: Math.round((os.totalmem() / 1024 / 1024 / 1024) * 10) / 10,
    totalDiskGB: getTotalDiskGB(),
    osName: osRelease.name,
    osVersion: osRelease.version,
    kernelVersion: os.release(),
    piModel: getPiModel(),
  };
}

// Get live system statistics (called frequently)
export function getLiveSystemStats(): LiveSystemStats {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptimeSeconds = os.uptime();

  return {
    cpuUsagePercent: getCpuUsage(),
    memoryUsedPercent: Math.round((usedMem / totalMem) * 1000) / 10,
    memoryUsedGB: Math.round((usedMem / 1024 / 1024 / 1024) * 100) / 100,
    cpuTempCelsius: getCpuTemp(),
    loadAverage: os.loadavg() as [number, number, number],
    uptimeSeconds: Math.floor(uptimeSeconds),
    uptimeFormatted: formatUptime(uptimeSeconds),
    timestamp: Date.now(),
  };
}
