"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { LiveStats } from "./live-stats";

export const dynamic = "force-dynamic";

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
  console.log("🔵 StatsDashboard rendering, isClient:", typeof window !== "undefined");

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Stats Dashboard
      </div>

      <LiveStats />
    </div>
  );
}
