import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import os from "os";

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

// Parse /etc/os-release for OS info
function getOsRelease(): { name: string; version: string } {
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
}

// Get Raspberry Pi model from /proc/device-tree/model
function getPiModel(): string | null {
  const model = safeReadFile("/proc/device-tree/model");
  if (model) {
    // Remove null bytes that sometimes appear
    return model.replace(/\0/g, "").trim();
  }
  return null;
}

// Get CPU temperature (Raspberry Pi specific)
function getCpuTemp(): number | null {
  // Try Raspberry Pi thermal zone
  const temp = safeReadFile("/sys/class/thermal/thermal_zone0/temp");
  if (temp) {
    const milliCelsius = parseInt(temp, 10);
    if (!isNaN(milliCelsius)) {
      return Math.round((milliCelsius / 1000) * 10) / 10; // Round to 1 decimal
    }
  }
  return null;
}

// Get total disk space for root partition
function getTotalDiskGB(): number {
  try {
    const output = execSync("df -B1 / 2>/dev/null | tail -1 | awk '{print $2}'", {
      encoding: "utf-8",
    });
    const bytes = parseInt(output.trim(), 10);
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
export function getStaticSystemInfo(): StaticSystemInfo {
  const cpus = os.cpus();
  const osRelease = getOsRelease();

  return {
    hostname: "raspberry-pi", // Sanitized - don't expose real hostname
    platform: os.platform(),
    arch: os.arch(),
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
