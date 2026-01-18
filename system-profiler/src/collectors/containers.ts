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
// Extracted from real production data in TEMP-sample-stream.json
// Note: memoryUsageBytes and memoryPercent are null in real data, so we'll keep them null
// Container order: web, system-profiler, db, ai-img-validator
const mockCPUPercentValues = [
  0.009751243781094527, // web
  0.01456359102244389,
  0.013930348258706468,
  0.01596009975062344,
  1.6530348258706467,
  0.013034825870646766,
  0.012935323383084577,
  0.017627118644067796,
  0.0167,
  0.01588089330024814,
];
const mockSystemProfilerCPUPercentValues = [
  0.03422885572139303,
  1.818354114713217,
  0.49552238805970145,
  0.10975124378109452,
  0.09253731343283582,
  0.04248756218905473,
  0.003582089552238806,
  0.11573200992555832,
  0.0421,
  0.04448877805486284,
];
const mockDbCPUPercentValues = [
  0,
  0,
  5.7808,
  0,
  0.3794,
  0,
  0.0025870646766169153,
  6.004962779156328,
  0,
  0,
];
const mockValidatorCPUPercentValues = [
  0.04169576059850374,
  0.0561,
  0.0584,
  0.04618453865336658,
  0.06914572864321608,
  0.04426799007444168,
  0.03751243781094527,
  0.06471464019851117,
  10.506867167919799,
  0.04437810945273632,
];

// Memory values (matching dev sample with variations)
// Container order: web, system-profiler, ai-img-validator, db
const mockWebMemoryUsageBytesValues = [
  1148194816,
  1150000000,
  1145000000,
  1152000000,
  1146000000,
  1151000000,
  1147000000,
  1153000000,
  1148000000,
  1150000000,
];
const mockWebMemoryPercentValues = [
  13.972643981471558,
  14.0,
  13.9,
  14.1,
  13.95,
  14.05,
  13.85,
  14.15,
  13.98,
  14.02,
];

const mockSystemProfilerMemoryUsageBytesValues = [
  57614336,
  58000000,
  57000000,
  58500000,
  57500000,
  58200000,
  57200000,
  58800000,
  57800000,
  58300000,
];
const mockSystemProfilerMemoryPercentValues = [
  0.7011219646169176,
  0.71,
  0.69,
  0.72,
  0.70,
  0.71,
  0.70,
  0.72,
  0.70,
  0.71,
];

const mockValidatorMemoryUsageBytesValues = [
  314736640,
  315000000,
  314000000,
  316000000,
  314500000,
  315500000,
  314200000,
  316200000,
  314800000,
  315200000,
];
const mockValidatorMemoryPercentValues = [
  3.8301017887931144,
  3.84,
  3.82,
  3.86,
  3.83,
  3.85,
  3.81,
  3.87,
  3.83,
  3.85,
];

const mockDbMemoryUsageBytesValues = [
  22470656,
  22500000,
  22400000,
  22600000,
  22450000,
  22550000,
  22420000,
  22620000,
  22480000,
  22520000,
];
const mockDbMemoryPercentValues = [
  0.2734505259411638,
  0.28,
  0.27,
  0.29,
  0.275,
  0.285,
  0.27,
  0.29,
  0.28,
  0.285,
];

// Generator function that cycles through an array with an offset
function* createValueGenerator<T>(values: T[], offset: number): Generator<T> {
  let index = offset % values.length;
  while (true) {
    yield values[index];
    index = (index + 1) % values.length;
  }
}

// Create generators for each container using their specific arrays
// Container order in getMockContainerStats: web, system-profiler, ai-img-validator, db
const cpuPercentGenerators = [
  createValueGenerator(mockCPUPercentValues, 0), // web (index 0)
  createValueGenerator(mockSystemProfilerCPUPercentValues, 0), // system-profiler (index 1)
  createValueGenerator(mockValidatorCPUPercentValues, 0), // ai-img-validator (index 2)
  createValueGenerator(mockDbCPUPercentValues, 0), // db (index 3)
];

const memoryUsageBytesGenerators = [
  createValueGenerator(mockWebMemoryUsageBytesValues, 0), // web
  createValueGenerator(mockSystemProfilerMemoryUsageBytesValues, 0), // system-profiler
  createValueGenerator(mockValidatorMemoryUsageBytesValues, 0), // ai-img-validator
  createValueGenerator(mockDbMemoryUsageBytesValues, 0), // db
];

const memoryPercentGenerators = [
  createValueGenerator(mockWebMemoryPercentValues, 0), // web
  createValueGenerator(mockSystemProfilerMemoryPercentValues, 0), // system-profiler
  createValueGenerator(mockValidatorMemoryPercentValues, 0), // ai-img-validator
  createValueGenerator(mockDbMemoryPercentValues, 0), // db
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
        memoryUsageBytes: memoryUsageBytesGenerators[0].next().value!,
        memoryLimitBytes: 8217448448, // Match sample data
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
        memoryUsageBytes: memoryUsageBytesGenerators[1].next().value!,
        memoryLimitBytes: 8217448448, // Match sample data
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
        memoryUsageBytes: memoryUsageBytesGenerators[2].next().value!,
        memoryLimitBytes: 8217448448, // Match sample data
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
        memoryUsageBytes: memoryUsageBytesGenerators[3].next().value!,
        memoryLimitBytes: 8217448448, // Match sample data
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
