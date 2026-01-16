import { devLog } from "./utils";

type SystemInfoResponse = {
  message: string;
  stats: {
    platform: string;
    architecture: string;
  };
};

export interface SystemStats {
  platform: string;
  arch: string;
}

// solution to build-time error: access env vars at runtime WITHIN FUNCTIONS, not at the top level of the file.
function getSystemProfilerBaseUrl(): string {
  if (!process.env.SYSTEM_PROFILER_BASE_URL) {
    throw new Error("SYSTEM_PROFILER_BASE_URL is not set");
  }
  return process.env.SYSTEM_PROFILER_BASE_URL!;
}

// Get static system information (called once, can be cached)
export async function getSystemStats(): Promise<SystemStats> {
  devLog("SYSTEM_PROFILER_BASE_URL: ", getSystemProfilerBaseUrl());
  const url = `${getSystemProfilerBaseUrl()}/debug/stats`;
  devLog("url: ", url);

  const response = await fetch(url);
  devLog("response: ", response);
  if (!response.ok) {
    throw new Error(`Failed to fetch system stats: ${response.statusText}`);
  }

  const data = (await response.json()) as SystemInfoResponse;

  devLog("⚙️ system-stats data: ", data);

  if (data.message !== "System stats") {
    throw new Error(`Invalid response from system stats: ${data.message}`);
  }

  const { platform, architecture } = data.stats;

  return {
    platform: platform,
    arch: architecture,
  };
}
