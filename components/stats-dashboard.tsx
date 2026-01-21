"use client";

import { LiveStats } from "./live-stats";

export const dynamic = "force-dynamic";

export function StatsDashboard() {
  return (
    <div className="space-y-4">
      {/* Connection status */}
      <LiveStats />
    </div>
  );
}
