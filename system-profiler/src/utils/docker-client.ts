import http from "http";
import { config } from "../config.js";

/**
 * Make an HTTP request to the Docker socket.
 */
export async function dockerRequest<T>(
  path: string,
  options: { timeout?: number } = {}
): Promise<T> {
  const { timeout = 5000 } = options;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: config.dockerSocket,
        path,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Failed to parse Docker response: ${data}`));
          }
        });
      }
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
 * Docker container inspect response (partial - only fields we need).
 */
export interface DockerContainerInspect {
  Id: string;
  Name: string;
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    Dead: boolean;
    Health?: {
      Status: string;
    };
  };
  RestartCount: number;
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
    })
  );

  return dockerRequest<DockerContainer[]>(
    `/containers/json?all=true&filters=${filter}`
  );
}

/**
 * Get container details (for health and restart count).
 */
export async function inspectContainer(
  id: string
): Promise<DockerContainerInspect> {
  return dockerRequest<DockerContainerInspect>(`/containers/${id}/json`);
}

/**
 * Get container stats (one-shot, non-streaming).
 */
export async function getContainerStats(
  id: string
): Promise<DockerContainerStats> {
  return dockerRequest<DockerContainerStats>(
    `/containers/${id}/stats?stream=false`,
    { timeout: 10000 }
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
