import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartWrap } from "./chart-wrap";
import { TooltipBox } from "./tooltip-box";
import { HistoryPoint, HISTORY_MAX } from "./types";

export function CpuMemoryChart({ history }: { history: HistoryPoint[] }) {
  // Calculate domains for CPU and Memory axes
  const cpuDomain = (() => {
    if (history.length === 0) return [0, 100];
    const cpuValues = history.map((h) => h.cpu).filter((v) => !Number.isNaN(v) && v != null);
    if (cpuValues.length === 0) return [0, 100];
    const min = Math.max(0, Math.min(...cpuValues) * 0.9);
    const max = Math.min(100, Math.max(...cpuValues) * 1.1);
    if (max < 5) {
      return [0, Math.max(5, max)];
    }
    return [min, max];
  })();

  const memDomain = (() => {
    if (history.length === 0) return [0, 100];
    const memValues = history.map((h) => h.mem).filter((v) => !Number.isNaN(v) && v != null);
    if (memValues.length === 0) return [0, 100];
    const min = Math.max(0, Math.min(...memValues) * 0.9);
    const max = Math.min(100, Math.max(...memValues) * 1.1);
    if (max < 5) {
      return [0, Math.max(5, max)];
    }
    return [min, max];
  })();

  return (
    <ChartWrap
      title="CPU & Memory — realtime trace"
      subtitle={`Last ${Math.min(history.length, HISTORY_MAX)} samples`}
      right={
        <span className="text-[11px] text-zinc-400">
          {history.length ? `${history[history.length - 1].label}` : "—"}
        </span>
      }
    >
      <div className="h-[220px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
            <YAxis
              yAxisId="cpu"
              orientation="left"
              width={50}
              domain={cpuDomain}
              tick={{ fill: "rgba(34,197,94,0.8)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              allowDecimals={true}
            />
            <YAxis
              yAxisId="mem"
              orientation="right"
              width={50}
              domain={memDomain}
              tick={{ fill: "rgba(59,130,246,0.8)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              allowDecimals={true}
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
              yAxisId="cpu"
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
              yAxisId="mem"
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
  );
}
