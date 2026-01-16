"use client";

import { Card, CardContent, CardHeader } from "@/components/card";
import { useEffect, useState } from "react";
import { devLog } from "../app/lib/utils";

function StatItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function LiveStats() {
  const [stats, setStats] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/stats/stream");
    devLog("🔵 [stream/client] LiveStats eventSource:", eventSource);

    eventSource.onopen = () => {
      devLog("🔵 [stream/client] Connection opened.");
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as string;
        devLog("🔵 [stream/client] message received:", data);
        setStats(data);
      } catch (e) {
        devLog("🔴 [stream/client] Failed to parse stats:", e);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      devLog("🔴 [stream/client] Connection lost. Reconnecting...");
      setError("Connection lost. Reconnecting...");
      // EventSource will automatically try to reconnect
    };

    return () => {
      devLog("🔴 [stream/client] LiveStats component unmounted. Closing eventSource.");
      eventSource.close();
    };
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Stats</h1>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Connection */}

        <div className="my-4">
          <h2 className="text-lg font-bold">Connection</h2>
          <StatItem title="Connected" value={connected ? "💚 Connected" : "🔴 Disconnected"} />
          <StatItem title="Error" value={error ? `🔴 ${error}` : "💚 No error"} />
        </div>
        <div className="my-4">
          <h2 className="text-lg font-bold">Stats</h2>
          <StatItem title="Stats" value={stats || "No stats"} />
        </div>
      </div>
    </div>
  );
}
