"use client";

import { LiveStats } from "./live-stats";

export const dynamic = "force-dynamic";

export function StatsDashboard() {
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
