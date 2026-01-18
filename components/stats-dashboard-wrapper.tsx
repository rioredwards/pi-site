"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

const StatsDashboard = dynamic(() => import("./stats-dashboard").then(mod => ({ default: mod.StatsDashboard })), {
  ssr: false,
  loading: () => <div className="text-muted-foreground">Loading stats...</div>
});

export function StatsDashboardWrapper() {
  useEffect(() => {
    console.log("🔵 StatsDashboardWrapper mounted on client");
  }, []);

  return <StatsDashboard />;
}
