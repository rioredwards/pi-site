"use client";

import { type SystemStats } from "@/app/lib/system-stats";
import { devLog } from "@/app/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { LiveStats } from "./live-stats";

export function StatItem({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function StatsDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch in the browser - prevents any server-side execution
    // because SYSTEM_PROFILER_BASE_URL isn't available during build time
    if (typeof window === "undefined") return;

    const fetchSystemStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const systemStats = (await response.json()) as SystemStats;
        devLog("systemStats: ", systemStats);
        setStats(systemStats);
        setError(null);
        toast({
          title: "Success",
          description: "System stats fetched successfully",
        });
      } catch (error) {
        devLog("Failed to fetch system stats: ", error);
        setError("Failed to fetch system stats");
        toast({
          title: "Error",
          description: "Failed to fetch system stats",
          variant: "destructive",
        });
      }

      setIsLoading(false);
    };
    fetchSystemStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Stats Dashboard
      </div>

      <LiveStats />

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatItem title="Architecture" value={stats?.arch || "N/A"} />
        <StatItem title="Platform" value={stats?.platform || "N/A"} />
      </div>
    </div>
  );
}
