import os from "os";
import { bytesToGB, getCpuTemp, getCpuUsage } from "../../../lib/system";
import { SystemInfo } from "../../../lib/types";

export async function getSystemInfo(): Promise<SystemInfo> {
  // Get CPU usage
  const cpuUsage = getCpuUsage();

  // Get memory info
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const cpuTemp = await getCpuTemp();

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpuTemp,
    cpuUsage,
    memoryUsage: {
      total: parseFloat(bytesToGB(totalMem)),
      used: parseFloat(bytesToGB(usedMem)),
      free: parseFloat(bytesToGB(freeMem)),
    },
  };
}
