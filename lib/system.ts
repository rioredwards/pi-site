import { exec } from "child_process";
import os, { platform } from "os";
import { promisify } from "util";

const execAsync = promisify(exec);

export function getCpuUsage() {
  const cpus = os.cpus();
  return cpus.map((cpu) => {
    const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
    const usage = 100 - (100 * cpu.times.idle) / total;
    return usage.toFixed(1);
  });
}

export async function getCpuTemp() {
  if (platform() !== "linux") return 0;
  try {
    const { stdout } = await execAsync("vcgencmd measure_temp");
    // in celsius! OBVIOUSLY!
    return parseFloat(stdout.replace("temp=", "").replace("'C", ""));
  } catch {
    // vcgencmd not available (e.g., on non-Raspberry Pi systems)
    return 0;
  }
}

export function bytesToGB(bytes: number) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}
