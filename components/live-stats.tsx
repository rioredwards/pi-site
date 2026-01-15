"use client";

import type { LiveSystemStats } from "@/app/lib/system-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, Cpu, Gauge, HardDrive, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveStatsProps {
  totalMemoryGB: number;
  totalDiskGB: number;
}

export function LiveStats({ totalMemoryGB, totalDiskGB }: LiveStatsProps) {
  const [stats, setStats] = useState<LiveSystemStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/stats/stream");

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as LiveSystemStats;
        setStats(data);
      } catch (e) {
        console.error("Failed to parse stats:", e);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      setError("Connection lost. Reconnecting...");
      // EventSource will automatically try to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Color based on value thresholds
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTempColor = (temp: number | null) => {
    if (temp === null) return "bg-gray-400";
    if (temp >= 80) return "bg-red-500";
    if (temp >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          }`}
        />
        {connected ? "Live" : error || "Connecting..."}
        {stats && (
          <span className="ml-auto">Updated: {new Date(stats.timestamp).toLocaleTimeString()}</span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpuUsagePercent.toFixed(1)}%</div>
            <Progress
              value={stats.cpuUsagePercent}
              className="mt-2"
              indicatorClassName={getUsageColor(stats.cpuUsagePercent)}
            />
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memoryUsedPercent.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.memoryUsedGB.toFixed(2)} GB / {totalMemoryGB} GB
            </p>
            <Progress
              value={stats.memoryUsedPercent}
              className="mt-2"
              indicatorClassName={getUsageColor(stats.memoryUsedPercent)}
            />
          </CardContent>
        </Card>

        {/* CPU Temperature */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cpuTempCelsius !== null ? `${stats.cpuTempCelsius}°C` : "N/A"}
            </div>
            {stats.cpuTempCelsius !== null && (
              <Progress
                value={Math.min(stats.cpuTempCelsius, 100)}
                className="mt-2"
                indicatorClassName={getTempColor(stats.cpuTempCelsius)}
              />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.cpuTempCelsius !== null
                ? stats.cpuTempCelsius >= 80
                  ? "Running hot!"
                  : stats.cpuTempCelsius >= 60
                  ? "Warm"
                  : "Cool"
                : "Temperature not available"}
            </p>
          </CardContent>
        </Card>

        {/* Load Average */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Load Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loadAverage[0].toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              1m: {stats.loadAverage[0].toFixed(2)} | 5m: {stats.loadAverage[1].toFixed(2)} | 15m:{" "}
              {stats.loadAverage[2].toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uptimeFormatted}</div>
            <p className="text-xs text-muted-foreground">
              {Math.floor(stats.uptimeSeconds / 86400)} days,{" "}
              {Math.floor((stats.uptimeSeconds % 86400) / 3600)} hours
            </p>
          </CardContent>
        </Card>

        {/* Refresh Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Refresh Rate</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5s</div>
            <p className="text-xs text-muted-foreground">Stats update every 5 seconds</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
