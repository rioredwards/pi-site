"use client";

import { Card, CardContent, CardHeader } from "@/components/card";
import { CombinedStats } from "@/shared/types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { devLog } from "../app/lib/utils";

type HistoryPoint = {
  t: number; // epoch ms
  label: string; // e.g. "12:34:56"
  cpu: number;
  mem: number;
  temp: number | null;
  rxRate: number | null; // bytes/sec
  txRate: number | null; // bytes/sec
};

const HISTORY_MAX = 90;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return null;
  return clamp(n, 0, 100);
}

function formatPercent(n: number | null | undefined, digits = 1) {
  const p = pct(n);
  if (p == null) return "—";
  return `${p.toFixed(digits)}%`;
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 ? 0 : i === 1 ? 0 : 1;
  return `${v.toFixed(digits)} ${units[i]}`;
}

function formatBps(bytesPerSec: number | null | undefined) {
  if (bytesPerSec == null || Number.isNaN(bytesPerSec)) return "—";
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatUptime(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts = [
    days ? `${days}d` : null,
    hrs ? `${hrs}h` : null,
    mins ? `${mins}m` : null,
    `${secs}s`,
  ].filter(Boolean);
  return parts.join(" ");
}

function formatTimeLabel(epochMs: number) {
  const d = new Date(epochMs);
  return d.toLocaleTimeString([], { hour12: false });
}

function statusPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border";
  const toneCls =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
        : tone === "bad"
          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
          : "bg-white/5 text-zinc-200 border-white/10";

  return (
    <span className={`${base} ${toneCls}`}>
      <span
        className={
          tone === "good"
            ? "h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
            : tone === "warn"
              ? "h-2 w-2 rounded-full bg-amber-400 animate-pulse"
              : tone === "bad"
                ? "h-2 w-2 rounded-full bg-rose-400 animate-pulse"
                : "h-2 w-2 rounded-full bg-zinc-400"
        }
      />
      {label}
    </span>
  );
}

function StatRow({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-base">{icon}</span> : null}
          <div className="text-xs font-medium text-zinc-400">{label}</div>
        </div>
        {sub ? (
          <div className="mt-1 text-[11px] leading-snug text-zinc-500">{sub}</div>
        ) : null}
      </div>
      <div className="shrink-0 text-right text-sm font-semibold text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function Meter({
  value,
  labelLeft,
  labelRight,
  tone,
}: {
  value: number | null | undefined; // 0..100
  labelLeft?: string;
  labelRight?: string;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const v = pct(value);
  const barTone =
    tone === "good"
      ? "from-emerald-500/70 to-emerald-400/70"
      : tone === "warn"
        ? "from-amber-500/70 to-amber-400/70"
        : tone === "bad"
          ? "from-rose-500/70 to-rose-400/70"
          : "from-white/30 to-white/20";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>{labelLeft ?? ""}</span>
        <span>{labelRight ?? (v == null ? "—" : `${v.toFixed(1)}%`)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barTone} transition-all duration-500`}
          style={{ width: `${v ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function ChartWrap({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs text-zinc-400">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TooltipBox({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
  formatter?: (p: any) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-zinc-100">{String(label ?? "")}</div>
      <div className="mt-1 space-y-1 text-zinc-300">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">{p.name ?? p.dataKey}</span>
            <span className="font-semibold">
              {formatter ? formatter(p) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveStats() {
  const [stats, setStats] = useState<CombinedStats | null>(null);
  const [lastGood, setLastGood] = useState<CombinedStats | null>(null);

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const lastNetRef = useRef<{ t: number; rx: number; tx: number } | null>(null);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // tick clock for "x seconds ago"
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventSource = new EventSource("/api/stats/stream");
    devLog("🔵 [stream/client] LiveStats eventSource:", eventSource);

    eventSource.onopen = () => {
      devLog("🔵 [stream/client] Connection opened.");
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event: MessageEvent<string>) => {
      try {
        if (!event.data) return;

        const parsed = JSON.parse(event.data) as CombinedStats | null;
        devLog("🔵 [stream/client] message received:", parsed);

        setStats(parsed);

        if (parsed) {
          setLastGood(parsed);

          // Build history point
          const epoch = Date.parse((parsed as any)?.timestamp ?? "") || Date.now();

          const cpu = (parsed as any)?.host?.cpu?.usagePercent ?? 0;
          const mem = (parsed as any)?.host?.memory?.usagePercent ?? 0;

          const tempAvailable = (parsed as any)?.host?.temperature?.available ?? false;
          const tempVal = tempAvailable ? (parsed as any)?.host?.temperature?.cpuCelsius : null;

          // Network (sum interfaces)
          const ifaces: any[] = (parsed as any)?.host?.network?.interfaces ?? [];
          const rxTotal = ifaces.reduce((sum, it) => sum + (it?.rxBytes ?? 0), 0);
          const txTotal = ifaces.reduce((sum, it) => sum + (it?.txBytes ?? 0), 0);

          let rxRate: number | null = null;
          let txRate: number | null = null;
          const last = lastNetRef.current;
          if (last) {
            const dt = Math.max(0.001, (epoch - last.t) / 1000);
            const drx = rxTotal - last.rx;
            const dtx = txTotal - last.tx;
            rxRate = drx >= 0 ? drx / dt : null;
            txRate = dtx >= 0 ? dtx / dt : null;
          }
          lastNetRef.current = { t: epoch, rx: rxTotal, tx: txTotal };

          const point: HistoryPoint = {
            t: epoch,
            label: formatTimeLabel(epoch),
            cpu,
            mem,
            temp: tempVal ?? null,
            rxRate,
            txRate,
          };

          setHistory((prev) => {
            const next = [...prev, point];
            return next.length > HISTORY_MAX ? next.slice(next.length - HISTORY_MAX) : next;
          });
        }
      } catch (e) {
        devLog("🔴 [stream/client] Failed to parse stats:", e);
        setError("Failed to parse stats");
      }
    };

    eventSource.onerror = (err) => {
      devLog("🔴 [stream/client] SSE error:", err);
      setConnected(false);
      setError("Connection lost. Reconnecting...");
    };

    return () => {
      devLog("🔴 [stream/client] LiveStats component unmounted. Closing eventSource.");
      eventSource.close();
    };
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

  const freshnessTone: "good" | "warn" | "bad" | "neutral" = useMemo(() => {
    if (!connected) return "bad";
    if (ageSeconds == null) return "neutral";
    if (ageSeconds < 3) return "good";
    if (ageSeconds < 8) return "warn";
    return "bad";
  }, [connected, ageSeconds]);

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

  const disksChart = useMemo(
    () =>
      disks.map((d) => ({
        name: d?.mountPoint ?? "—",
        used: pct(d?.usagePercent) ?? 0,
        free: 100 - (pct(d?.usagePercent) ?? 0),
      })),
    [disks]
  );

  const containersByCpu = useMemo(() => {
    const rows = containers
      .map((c) => ({
        name: c?.name ?? "—",
        cpu: Number(c?.cpuPercent ?? 0),
        health: String(c?.health ?? c?.state ?? "—"),
        state: String(c?.state ?? "—"),
        restart: Number(c?.restartCount ?? 0),
        image: String(c?.image ?? ""),
      }))
      .sort((a, b) => b.cpu - a.cpu);

    return rows.slice(0, 8);
  }, [containers]);

  const servicesChart = useMemo(
    () =>
      services.map((s) => ({
        name: s?.name ?? "—",
        ms: Number(s?.responseTimeMs ?? 0),
        healthy: Boolean(s?.healthy),
      })),
    [services]
  );

  const pageBg =
    "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 p-6 shadow-2xl";

  const glow =
    "pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),rgba(168,85,247,0.10),rgba(0,0,0,0))] blur-3xl";

  const gridGlow =
    "pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]";

  // Loading skeleton (first paint)
  if (!effective) {
    return (
      <div className={pageBg}>
        <div className={glow} />
        <div className={gridGlow} />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Live Stats</div>
            <div className="mt-1 text-xs text-zinc-400">
              Waiting for the first realtime payload…
            </div>
          </div>
          {statusPill({ label: connected ? "LIVE (no data yet)" : "DISCONNECTED", tone: connected ? "warn" : "bad" })}
        </div>

        <div className="relative mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-2 w-full animate-pulse rounded bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      <div className={glow} />
      <div className={gridGlow} />

      {/* Header */}
      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Live Stats
            </h1>

            {/* Live pill */}
            {statusPill({
              label:
                freshnessTone === "good"
                  ? "LIVE"
                  : freshnessTone === "warn"
                    ? "LIVE (lagging)"
                    : freshnessTone === "bad"
                      ? "OFFLINE / STALE"
                      : "LIVE",
              tone: freshnessTone,
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              Host: <span className="font-semibold text-zinc-200">{sys?.hostname ?? "—"}</span>
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              Kernel: <span className="font-semibold text-zinc-200">{sys?.kernelVersion ?? "—"}</span>
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              Uptime:{" "}
              <span className="font-semibold text-zinc-200">
                {formatUptime(sys?.uptimeSeconds)}
              </span>
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              Last update:{" "}
              <span className="font-semibold text-zinc-200">
                {lastUpdatedMs ? new Date(lastUpdatedMs).toLocaleTimeString([], { hour12: false }) : "—"}
              </span>
              {ageSeconds != null ? (
                <span className="text-zinc-500">({ageSeconds.toFixed(1)}s ago)</span>
              ) : null}
            </span>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              ⚠️ {error}
            </div>
          ) : null}
        </div>

        {/* Connection summary card */}
        <div className="w-full md:w-[340px]">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="text-sm font-semibold text-zinc-100">Realtime</div>
              <div className="mt-1 text-xs text-zinc-400">
                Streaming via SSE • Auto-updating charts
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow
                icon="🔌"
                label="Connection"
                value={connected ? "Connected" : "Disconnected"}
                sub={connected ? "Receiving events from /api/stats/stream" : "Waiting for reconnect…"}
              />
              <StatRow
                icon="⏱️"
                label="Freshness"
                value={
                  ageSeconds == null
                    ? "—"
                    : ageSeconds < 3
                      ? "Hot"
                      : ageSeconds < 8
                        ? "Warm"
                        : "Stale"
                }
                sub="How recently the last payload arrived"
              />
              <div className="pt-2">
                <Meter
                  value={ageSeconds == null ? 0 : clamp(100 - ageSeconds * 12.5, 0, 100)}
                  tone={freshnessTone}
                  labelLeft="Stream quality"
                  labelRight={ageSeconds == null ? "—" : `${ageSeconds.toFixed(1)}s ago`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top KPI row */}
      <div className="relative mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="text-xs font-medium text-zinc-400">CPU</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-zinc-100">
                {formatPercent(cpu?.usagePercent)}
              </div>
              <div className="text-xs text-zinc-500">{cpu?.cores ? `${cpu.cores} cores` : ""}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Meter
              value={cpu?.usagePercent ?? 0}
              tone={(cpu?.usagePercent ?? 0) < 55 ? "good" : (cpu?.usagePercent ?? 0) < 80 ? "warn" : "bad"}
              labelLeft="Usage"
            />
            <div className="text-[11px] text-zinc-500">
              Load avg:{" "}
              <span className="font-semibold text-zinc-300">
                {(cpu?.loadAverage ?? []).join(" / ") || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="text-xs font-medium text-zinc-400">Memory</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-zinc-100">
                {formatPercent(memory?.usagePercent)}
              </div>
              <div className="text-xs text-zinc-500">
                {formatBytes(memory?.usedBytes)} / {formatBytes(memory?.totalBytes)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Meter
              value={memory?.usagePercent ?? 0}
              tone={(memory?.usagePercent ?? 0) < 65 ? "good" : (memory?.usagePercent ?? 0) < 85 ? "warn" : "bad"}
              labelLeft="Usage"
            />
            <div className="text-[11px] text-zinc-500">
              Available:{" "}
              <span className="font-semibold text-zinc-300">
                {formatBytes(memory?.availableBytes)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="text-xs font-medium text-zinc-400">Disk</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-100">
              {disks.length ? formatPercent(disks[0]?.usagePercent) : "—"}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Meter
              value={disks.length ? disks[0]?.usagePercent : 0}
              tone={(disks[0]?.usagePercent ?? 0) < 70 ? "good" : (disks[0]?.usagePercent ?? 0) < 88 ? "warn" : "bad"}
              labelLeft={disks[0]?.mountPoint ? `Mount ${disks[0].mountPoint}` : "Primary mount"}
            />
            <div className="text-[11px] text-zinc-500">
              Free:{" "}
              <span className="font-semibold text-zinc-300">
                {formatBytes(disks[0]?.freeBytes)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="text-xs font-medium text-zinc-400">Temperature</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-zinc-100">
                {temp?.available ? `${Number(temp?.cpuCelsius ?? 0).toFixed(1)}°C` : "—"}
              </div>
              <div className="text-xs text-zinc-500">
                {temp?.available ? "CPU" : "Unavailable"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Meter
              value={
                temp?.available
                  ? clamp(((Number(temp?.cpuCelsius ?? 0) - 25) / (85 - 25)) * 100, 0, 100)
                  : 0
              }
              tone={
                !temp?.available
                  ? "neutral"
                  : Number(temp?.cpuCelsius ?? 0) < 60
                    ? "good"
                    : Number(temp?.cpuCelsius ?? 0) < 75
                      ? "warn"
                      : "bad"
              }
              labelLeft="Thermal headroom"
              labelRight={temp?.available ? `${Number(temp?.cpuCelsius ?? 0).toFixed(1)}°C` : "—"}
            />
            <div className="text-[11px] text-zinc-500">
              Hint: this can spike under build/deploy, so it’s a great “realtime flex”.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="relative mt-6 grid gap-4 lg:grid-cols-2">
        <ChartWrap
          title="CPU & Memory — realtime trace"
          subtitle={`Last ${Math.min(history.length, HISTORY_MAX)} samples`}
          right={
            <span className="text-[11px] text-zinc-400">
              {history.length ? `${history[history.length - 1].label}` : "—"}
            </span>
          }
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={
                    <TooltipBox
                      formatter={(p) => `${Number(p.value).toFixed(1)}%`}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke="rgba(34,197,94,0.9)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={450}
                />
                <Line
                  type="monotone"
                  dataKey="mem"
                  name="Mem %"
                  stroke="rgba(59,130,246,0.9)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={450}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartWrap>

        <ChartWrap
          title="Network — bursty is beautiful"
          subtitle="Derived from interface byte counters (rate computed client-side)"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  tickFormatter={(v) => formatBytes(Number(v))}
                />
                <Tooltip
                  content={
                    <TooltipBox
                      formatter={(p) => formatBps(Number(p.value))}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="rxRate"
                  name="RX (B/s)"
                  stroke="rgba(168,85,247,0.95)"
                  fill="rgba(168,85,247,0.22)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={450}
                />
                <Area
                  type="monotone"
                  dataKey="txRate"
                  name="TX (B/s)"
                  stroke="rgba(244,63,94,0.9)"
                  fill="rgba(244,63,94,0.18)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={450}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartWrap>
      </div>

      {/* Lower grid */}
      <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
        <ChartWrap
          title="Disk usage by mount"
          subtitle="A quick way to show the system is real"
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disksChart} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                />
                <Tooltip
                  content={
                    <TooltipBox
                      formatter={(p) => `${Number(p.value).toFixed(1)}%`}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Bar
                  dataKey="used"
                  name="Used %"
                  fill="rgba(245,158,11,0.75)"
                  radius={[8, 8, 8, 8]}
                  isAnimationActive={true}
                  animationDuration={450}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrap>

        <ChartWrap
          title="Top containers by CPU"
          subtitle={`${containerSummary?.running ?? containers.length} running • ${containerSummary?.unhealthy ?? 0} unhealthy`}
          right={statusPill({
            label:
              Number(containerSummary?.unhealthy ?? 0) === 0
                ? "Containers OK"
                : "Container issues",
            tone: Number(containerSummary?.unhealthy ?? 0) === 0 ? "good" : "warn",
          })}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={containersByCpu} margin={{ left: 12, right: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={65}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  tickFormatter={(v) => `${v.toFixed ? v.toFixed(0) : v}%`}
                />
                <Tooltip
                  content={
                    <TooltipBox
                      formatter={(p) => `${Number(p.value).toFixed(2)}%`}
                    />
                  }
                />
                <Bar
                  dataKey="cpu"
                  name="CPU %"
                  fill="rgba(34,197,94,0.75)"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={450}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {containersByCpu.slice(0, 4).map((c) => {
              const tone =
                c.health === "healthy"
                  ? "good"
                  : c.health === "starting"
                    ? "warn"
                    : c.health === "unhealthy"
                      ? "bad"
                      : c.state === "running"
                        ? "neutral"
                        : "bad";

              return (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-100">
                      {c.name}
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {c.image} • restarts: {c.restart}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-zinc-100">
                      {c.cpu.toFixed(2)}%
                    </div>
                    {statusPill({
                      label: String(c.health),
                      tone,
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartWrap>

        <ChartWrap
          title="Service health & latency"
          subtitle="Heartbeat checks (great realtime signal)"
          right={statusPill({
            label: allHealthy ? "All healthy" : "Degraded",
            tone: allHealthy ? "good" : "warn",
          })}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesChart}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  tickFormatter={(v) => `${v}ms`}
                />
                <Tooltip
                  content={
                    <TooltipBox
                      formatter={(p) => `${Number(p.value).toFixed(0)} ms`}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
                />
                <Bar
                  dataKey="ms"
                  name="Response time"
                  fill="rgba(59,130,246,0.75)"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={450}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {services.map((s, i) => {
              const healthy = Boolean(s?.healthy);
              const tone = healthy ? "good" : "bad";
              return (
                <div
                  key={String(s?.name ?? i)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-100">
                      {s?.name ?? "—"}
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {s?.url ?? ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-zinc-100">
                      {s?.responseTimeMs != null ? `${s.responseTimeMs}ms` : "—"}
                    </div>
                    {statusPill({ label: healthy ? "healthy" : "down", tone })}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartWrap>
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
