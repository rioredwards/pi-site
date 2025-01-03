export type Photo = {
  id: string;
  order: number;
  sessionId: string;
  imgFilename: string;
  src: string;
  alt: string;
};

export type SystemInfo = {
  hostname: string;
  platform: string;
  architecture: string;
  cpuTemp: number;
  cpuUsage: string[];
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
};
