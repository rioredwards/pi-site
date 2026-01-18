import type { ContainerInfo, ContainerStats } from "@pi-site/shared/types.js";
import { config } from "../config.js";
import {
  calculateCpuPercent,
  getContainerStats,
  inspectContainer,
  listContainers,
} from "../utils/docker-client.js";

/**
 * Map Docker state to our simplified state type.
 */
function mapState(
  state: string
): "running" | "exited" | "paused" | "restarting" | "dead" | "created" {
  const s = state.toLowerCase();
  if (s === "running") return "running";
  if (s === "exited") return "exited";
  if (s === "paused") return "paused";
  if (s === "restarting") return "restarting";
  if (s === "dead") return "dead";
  return "created";
}

/**
 * Map Docker health status to our simplified health type.
 */
function mapHealth(
  healthStatus?: string
): "healthy" | "unhealthy" | "starting" | "none" {
  if (!healthStatus) return "none";
  const h = healthStatus.toLowerCase();
  if (h === "healthy") return "healthy";
  if (h === "unhealthy") return "unhealthy";
  if (h === "starting") return "starting";
  return "none";
}

/**
 * Get real container stats from Docker socket.
 */
export async function getContainerStatsReal(): Promise<ContainerStats> {
  const containers = await listContainers();

  // Gather details and stats for each container in parallel
  const containerInfos = await Promise.all(
    containers.map(async (container): Promise<ContainerInfo> => {
      const name = container.Names[0]?.replace(/^\//, "") || "unknown";

      try {
        // Fetch inspect and stats in parallel
        const [inspect, stats] = await Promise.all([
          inspectContainer(container.Id),
          container.State === "running"
            ? getContainerStats(container.Id)
            : Promise.resolve(null),
        ]);

        const cpuPercent = stats ? calculateCpuPercent(stats) : null;
        const memoryUsage = stats?.memory_stats.usage ?? null;
        const memoryLimit = stats?.memory_stats.limit ?? null;
        const memoryPercent =
          memoryUsage && memoryLimit && memoryLimit > 0
            ? (memoryUsage / memoryLimit) * 100
            : null;

        return {
          id: container.Id.substring(0, 12),
          name,
          image: container.Image,
          status: container.Status,
          state: mapState(inspect.State.Status),
          health: mapHealth(inspect.State.Health?.Status),
          restartCount: inspect.RestartCount,
          cpuPercent,
          memoryUsageBytes: memoryUsage,
          memoryLimitBytes: memoryLimit,
          memoryPercent,
        };
      } catch (err) {
        // If we can't get details, return basic info
        return {
          id: container.Id.substring(0, 12),
          name,
          image: container.Image,
          status: container.Status,
          state: mapState(container.State),
          health: "none",
          restartCount: 0,
          cpuPercent: null,
          memoryUsageBytes: null,
          memoryLimitBytes: null,
          memoryPercent: null,
        };
      }
    })
  );

  // Calculate summary
  const summary = {
    total: containerInfos.length,
    running: containerInfos.filter((c) => c.state === "running").length,
    stopped: containerInfos.filter((c) => c.state === "exited").length,
    unhealthy: containerInfos.filter((c) => c.health === "unhealthy").length,
  };

  return {
    containers: containerInfos,
    summary,
  };
}

// Arrays of values to cycle through for varying mock data
const mockCPUPercentValues = [5.2, 5.5, 4.9, 5.8, 5.1, 5.3];
const mockMemoryUsageBytesValues = [
  256 * 1024 * 1024,
  270 * 1024 * 1024,
  245 * 1024 * 1024,
  280 * 1024 * 1024,
  250 * 1024 * 1024,
  265 * 1024 * 1024,
];
const mockMemoryPercentValues = [25, 26.3, 23.9, 27.3, 24.4, 25.9];

// Generator function that cycles through an array with an offset
function* createValueGenerator<T>(values: T[], offset: number): Generator<T> {
  let index = offset % values.length;
  while (true) {
    yield values[index];
    index = (index + 1) % values.length;
  }
}

// Create generators for each varying parameter with different offsets per container
const cpuPercentGenerators = [
  createValueGenerator(mockCPUPercentValues, 0), // web
  createValueGenerator(mockCPUPercentValues, 1), // system-profiler
  createValueGenerator(mockCPUPercentValues, 2), // ai-img-validator
  createValueGenerator(mockCPUPercentValues, 3), // db
];

const memoryUsageGenerators = [
  createValueGenerator(mockMemoryUsageBytesValues, 0), // web
  createValueGenerator(mockMemoryUsageBytesValues, 2), // system-profiler
  createValueGenerator(mockMemoryUsageBytesValues, 4), // ai-img-validator
  createValueGenerator(mockMemoryUsageBytesValues, 1), // db
];

const memoryPercentGenerators = [
  createValueGenerator(mockMemoryPercentValues, 0), // web
  createValueGenerator(mockMemoryPercentValues, 1), // system-profiler
  createValueGenerator(mockMemoryPercentValues, 2), // ai-img-validator
  createValueGenerator(mockMemoryPercentValues, 3), // db
];

/**
 * Get mock container stats for development.
 */
export function getMockContainerStats(): ContainerStats {
  return {
    containers: [
      {
        id: "abc123",
        name: "pi-site-web-1",
        image: "pi-site-web:latest",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: cpuPercentGenerators[0].next().value!,
        memoryUsageBytes: memoryUsageGenerators[0].next().value!,
        memoryLimitBytes: 1024 * 1024 * 1024,
        memoryPercent: memoryPercentGenerators[0].next().value!,
      },
      {
        id: "def456",
        name: "pi-site-system-profiler-1",
        image: "pi-site-system-profiler:latest",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: cpuPercentGenerators[1].next().value!,
        memoryUsageBytes: memoryUsageGenerators[1].next().value!,
        memoryLimitBytes: 512 * 1024 * 1024,
        memoryPercent: memoryPercentGenerators[1].next().value!,
      },
      {
        id: "ghi789",
        name: "pi-site-ai-img-validator-1",
        image: "pi-site/ai-img-validator:stable",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: cpuPercentGenerators[2].next().value!,
        memoryUsageBytes: memoryUsageGenerators[2].next().value!,
        memoryLimitBytes: 2 * 1024 * 1024 * 1024,
        memoryPercent: memoryPercentGenerators[2].next().value!,
      },
      {
        id: "jkl012",
        name: "pi-site-db-1",
        image: "postgres:17",
        status: "Up 2 hours",
        state: "running",
        health: "healthy",
        restartCount: 0,
        cpuPercent: cpuPercentGenerators[3].next().value!,
        memoryUsageBytes: memoryUsageGenerators[3].next().value!,
        memoryLimitBytes: 512 * 1024 * 1024,
        memoryPercent: memoryPercentGenerators[3].next().value!,
      },
    ],
    summary: {
      total: 4,
      running: 4,
      stopped: 0,
      unhealthy: 0,
    },
  };
}

/**
 * Collect container stats - uses real Docker API or mock based on config.
 */
export async function collectContainerStats(): Promise<ContainerStats> {
  if (config.mockHostStats) {
    return getMockContainerStats();
  }

  try {
    return await getContainerStatsReal();
  } catch (err) {
    // Fall back to mock if Docker socket unavailable
    console.error("Docker socket error, using mock data:", err);
    return getMockContainerStats();
  }
}
