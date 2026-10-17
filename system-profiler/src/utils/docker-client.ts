import http from "http";
import { config } from "../config.js";

/**
 * Make an HTTP request to the Docker socket.
 */
export async function dockerRequest<T>(
  path: string,
  options: { timeout?: number } = {},
): Promise<T> {
  const { timeout = 5000 } = options;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: new URL(config.dockerUrl).hostname,
        port: new URL(config.dockerUrl).port,
        path,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Docker metrics HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > 2_000_000) req.destroy(new Error("Docker response too large"));
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error("Invalid Docker metrics response"));
          }
        });
      },
    );

    req.on("error", (err) => {
      reject(new Error(`Docker socket error: ${err.message}`));
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error("Docker socket timeout"));
    });

    req.end();
  });
}

/**
 * Docker container list response (partial - only fields we need).
 */
export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Labels: Record<string, string>;
}

/**
 * Docker container stats response (partial - only fields we need).
 */
export interface DockerContainerStats {
  cpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
    online_cpus: number;
  };
  precpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
  };
}

/**
 * List containers filtered by stack label.
 */
export async function listContainers(): Promise<DockerContainer[]> {
  const filter = encodeURIComponent(
    JSON.stringify({
      label: [`${config.stackLabel}=${config.stackName}`],
    }),
  );

  return dockerRequest<DockerContainer[]>(
    `/containers/json?all=true&filters=${filter}`,
  );
}

/**
 * Get container stats (one-shot, non-streaming).
 */
export async function getContainerStats(
  id: string,
): Promise<DockerContainerStats> {
  return dockerRequest<DockerContainerStats>(
    `/containers/${id}/stats?stream=false`,
    { timeout: 10000 },
  );
}

/**
 * Calculate CPU percentage from stats.
 */
export function calculateCpuPercent(stats: DockerContainerStats): number {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

  if (systemDelta <= 0 || cpuDelta < 0) return 0;

  const cpuCount = stats.cpu_stats.online_cpus || 1;
  return (cpuDelta / systemDelta) * cpuCount * 100;
}
