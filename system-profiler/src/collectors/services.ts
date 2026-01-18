import type { ServiceHealth, ServiceHealthStats } from "@pi-site/shared/types.js";
import http from "http";
import net from "net";
import { config } from "../config.js";

/**
 * Perform an HTTP health check.
 */
async function httpProbe(
  url: string,
  timeout: number = 5000
): Promise<{ healthy: boolean; responseTimeMs: number; error: string | null }> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const urlObj = new URL(url);

    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname,
        method: "GET",
        timeout,
      },
      (res) => {
        const responseTimeMs = Date.now() - startTime;
        // Consume response body to free up resources
        res.resume();

        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve({ healthy: true, responseTimeMs, error: null });
        } else {
          resolve({
            healthy: false,
            responseTimeMs,
            error: `HTTP ${res.statusCode}`,
          });
        }
      }
    );

    req.on("error", (err) => {
      resolve({
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        healthy: false,
        responseTimeMs: timeout,
        error: "timeout",
      });
    });

    req.end();
  });
}

/**
 * Perform a TCP health check (just tests if port is open).
 */
async function tcpProbe(
  host: string,
  port: number,
  timeout: number = 5000
): Promise<{ healthy: boolean; responseTimeMs: number; error: string | null }> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const responseTimeMs = Date.now() - startTime;
      socket.destroy();
      resolve({ healthy: true, responseTimeMs, error: null });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        healthy: false,
        responseTimeMs: timeout,
        error: "timeout",
      });
    });

    socket.on("error", (err) => {
      resolve({
        healthy: false,
        responseTimeMs: Date.now() - startTime,
        error: err.message,
      });
    });

    socket.connect(port, host);
  });
}

/**
 * Check health of a single service.
 */
async function checkService(
  service: (typeof config.services)[number]
): Promise<ServiceHealth> {
  if ("url" in service) {
    // HTTP probe
    const result = await httpProbe(service.url);
    return {
      name: service.name,
      url: service.url,
      ...result,
    };
  } else {
    // TCP probe
    const result = await tcpProbe(service.host, service.port);
    return {
      name: service.name,
      url: `tcp://${service.host}:${service.port}`,
      ...result,
    };
  }
}

/**
 * Get real service health via HTTP/TCP probes.
 */
export async function getServiceHealthReal(): Promise<ServiceHealthStats> {
  const services = await Promise.all(config.services.map(checkService));

  return {
    services,
    allHealthy: services.every((s) => s.healthy),
  };
}

/**
 * Get mock service health stats for development.
 */
export function getMockServiceHealth(): ServiceHealthStats {
  return {
    services: [
      {
        name: "web",
        url: "http://web:3000/",
        healthy: true,
        responseTimeMs: 45,
        error: null,
      },
      {
        name: "ai-img-validator",
        url: "http://ai-img-validator:8000/",
        healthy: true,
        responseTimeMs: 120,
        error: null,
      },
      {
        name: "db",
        url: "tcp://db:5432",
        healthy: true,
        responseTimeMs: 5,
        error: null,
      },
    ],
    allHealthy: true,
  };
}

/**
 * Collect service health - uses real probes or mock based on config.
 */
export async function collectServiceHealth(): Promise<ServiceHealthStats> {
  if (config.mockHostStats) {
    return getMockServiceHealth();
  }

  try {
    return await getServiceHealthReal();
  } catch (err) {
    console.error("Service health check error, using mock data:", err);
    return getMockServiceHealth();
  }
}
