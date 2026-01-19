import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartWrap } from "./chart-wrap";
import { StatusPill } from "./status-pill";
import { TooltipBox } from "./tooltip-box";
import { Tone } from "./types";

export function ServicesChart({
  services,
  allHealthy,
}: {
  services: any[];
  allHealthy: boolean | null;
}) {
  const servicesChart = services.map((s) => ({
    name: s?.name ?? "—",
    ms: Number(s?.responseTimeMs ?? 0),
    healthy: Boolean(s?.healthy),
  }));

  return (
    <ChartWrap
      title="Service health & latency"
      subtitle="Heartbeat checks (great realtime signal)"
      right={
        <StatusPill
          label={allHealthy ? "All healthy" : "Degraded"}
          tone={allHealthy ? "good" : "warn"}
        />
      }
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
          const tone: Tone = healthy ? "good" : "bad";
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
                <StatusPill label={healthy ? "healthy" : "down"} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartWrap>
  );
}
