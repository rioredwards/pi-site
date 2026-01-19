import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartWrap } from "./chart-wrap";
import { StatusPill } from "./status-pill";
import { TooltipBox } from "./tooltip-box";
import { Tone } from "./types";

export function ContainersChart({
  containers,
  containerSummary,
}: {
  containers: any[];
  containerSummary: any;
}) {
  const containersByCpu = containers
    .map((c) => ({
      name: c?.name ?? "—",
      cpu: Number(c?.cpuPercent ?? 0),
      health: String(c?.health ?? c?.state ?? "—"),
      state: String(c?.state ?? "—"),
      restart: Number(c?.restartCount ?? 0),
      image: String(c?.image ?? ""),
    }))
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 8);

  return (
    <ChartWrap
      title="Top containers by CPU"
      subtitle={`${containerSummary?.running ?? containers.length} running • ${containerSummary?.unhealthy ?? 0} unhealthy`}
      right={
        <StatusPill
          label={
            Number(containerSummary?.unhealthy ?? 0) === 0
              ? "Containers OK"
              : "Container issues"
          }
          tone={Number(containerSummary?.unhealthy ?? 0) === 0 ? "good" : "warn"}
        />
      }
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
          const tone: Tone =
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
                <StatusPill
                  label={String(c.health)}
                  tone={tone}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartWrap>
  );
}
