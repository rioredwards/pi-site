// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: undefined;
}

export interface ApiErrorResponse {
  data?: undefined;
  error: string;
}

export type Response<T> = ApiResponse<T> | ApiErrorResponse;

// Host Stats
export interface CpuStats {
  usagePercent: number;
  loadAverage: [number, number, number];
  cores: number;
}

export interface MemoryStats {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export interface DiskStats {
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
}

export interface TemperatureStats {
  cpuCelsius: number | null;
  available: boolean;
}

export interface NetworkInterface {
  name: string;
  rxBytes: number;
  txBytes: number;
}

export interface NetworkStats {
  interfaces: NetworkInterface[];
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  uptimeSeconds: number;
  kernelVersion: string | null;
}

export interface HostStats {
  cpu: CpuStats;
  memory: MemoryStats;
  disks: DiskStats[];
  temperature: TemperatureStats;
  network: NetworkStats;
  system: SystemInfo;
}

// Container Stats
export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: "running" | "exited" | "paused" | "restarting" | "dead" | "created";
  health: "healthy" | "unhealthy" | "starting" | "none";
  restartCount: number;
  cpuPercent: number | null;
  memoryUsageBytes: number | null;
  memoryLimitBytes: number | null;
  memoryPercent: number | null;
}

export interface ContainerSummary {
  total: number;
  running: number;
  stopped: number;
  unhealthy: number;
}

export interface ContainerStats {
  containers: ContainerInfo[];
  summary: ContainerSummary;
}

// Service Health
export interface ServiceHealth {
  name: string;
  url: string;
  healthy: boolean;
  responseTimeMs: number | null;
  error: string | null;
}

export interface ServiceHealthStats {
  services: ServiceHealth[];
  allHealthy: boolean;
}

// Combined Stats
export interface CombinedStats {
  timestamp: string;
  host: HostStats;
  containers: ContainerStats;
  services: ServiceHealthStats;
}

// Health check response
export interface HealthResponse {
  ok: boolean;
  mockMode?: boolean;
}
