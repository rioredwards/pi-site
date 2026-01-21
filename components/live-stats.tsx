"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectionSummary } from "./live-stats/connection-summary";
import { ContainersChart } from "./live-stats/containers-chart";
import { CpuMemoryChart } from "./live-stats/cpu-memory-chart";
import { DiskChart } from "./live-stats/disk-chart";
import { HeaderSection } from "./live-stats/header-section";
import { KpiCards } from "./live-stats/kpi-cards";
import { LoadingSkeleton } from "./live-stats/loading-skeleton";
import { NetworkChart } from "./live-stats/network-chart";
import { ServicesChart } from "./live-stats/services-chart";
import { Tone } from "./live-stats/types";
import { useStatsStream } from "./live-stats/use-stats-stream";

export function LiveStats() {
  const { stats, lastGood, history, connected, error } = useStatsStream();
  const [now, setNow] = useState(() => Date.now());

  // tick clock for "x seconds ago"
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const effective = stats ?? lastGood;

  const lastUpdatedMs = useMemo(() => {
    if (!effective) return null;
    const t = Date.parse((effective as any)?.timestamp ?? "");
    return Number.isFinite(t) ? t : null;
  }, [effective]);

  const ageSeconds = useMemo(() => {
    if (!lastUpdatedMs) return null;
    return Math.max(0, (now - lastUpdatedMs) / 1000);
  }, [now, lastUpdatedMs]);

  const freshnessTone: Tone = useMemo(() => {
    if (!connected) return "bad";
    if (ageSeconds == null) return "neutral";
    if (ageSeconds < 3) return "good";
    if (ageSeconds < 8) return "warn";
    return "bad";
  }, [connected, ageSeconds]);

  // Loading skeleton (first paint)
  if (!effective) {
    return <LoadingSkeleton connected={connected} />;
  }

  // Host snapshots
  const host = (effective as any)?.host;
  const cpu = host?.cpu;
  const memory = host?.memory;
  const disks: any[] = host?.disks ?? [];
  const sys = host?.system;
  const temp = host?.temperature;

  // Containers / services
  const containers: any[] = (effective as any)?.containers?.containers ?? [];
  const containerSummary = (effective as any)?.containers?.summary;
  const services: any[] = (effective as any)?.services?.services ?? [];
  const allHealthy = (effective as any)?.services?.allHealthy ?? null;

  const pageBg =
    "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 p-6 shadow-2xl before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.18] before:content-[''] before:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] before:[background-size:48px_48px]";

  const glow =
    "pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),rgba(168,85,247,0.10),rgba(0,0,0,0))] blur-3xl";

  return (
    <div className={pageBg}>
      <div className={glow} />

      {/* Header */}
      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <HeaderSection
          sys={sys}
          lastUpdatedMs={lastUpdatedMs}
          ageSeconds={ageSeconds}
          freshnessTone={freshnessTone}
          error={error}
        />

        <ConnectionSummary
          connected={connected}
          ageSeconds={ageSeconds}
          freshnessTone={freshnessTone}
        />
      </div>

      {/* Top KPI row */}
      <KpiCards cpu={cpu} memory={memory} disks={disks} temp={temp} />

      {/* Charts */}
      <div className="relative mt-6 grid gap-4 lg:grid-cols-2">
        <CpuMemoryChart history={history} />
        <NetworkChart history={history} />
      </div>

      {/* Lower grid */}
      <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DiskChart disks={disks} />
        <ContainersChart containers={containers} containerSummary={containerSummary} />
        <ServicesChart services={services} allHealthy={allHealthy} />
      </div>

      {/* Footer hint */}
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-zinc-200">Pro-tip:</span>
          Try reloading the page, restarting a container, or running a build — the charts will visibly react.
        </div>
        <div className="text-zinc-500">
          {connected ? "Streaming" : "Not connected"} • {history.length} samples buffered
        </div>
      </div>
    </div>
  );
}
