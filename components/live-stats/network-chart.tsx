import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartWrap } from "./chart-wrap";
import { TooltipBox } from "./tooltip-box";
import { HistoryPoint } from "./types";
import { formatBps, formatBytes } from "./utils";

export function NetworkChart({ history }: { history: HistoryPoint[] }) {
  return (
    <ChartWrap
      title="Network"
      subtitle="Derived from interface byte counters (rate computed client-side)"
    >
      <div className="h-[220px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="rx"
              orientation="left"
              tick={{ fill: "rgba(168,85,247,0.8)", fontSize: 11 }}
              tickFormatter={(v) => formatBytes(Number(v))}
              domain={[
                (dataMin) => Math.max(0, dataMin * 0.9),
                (dataMax) => (dataMax === 0 ? 1 : dataMax * 1.1),
              ]}
            />
            <YAxis
              yAxisId="tx"
              orientation="right"
              tick={{ fill: "rgba(244,63,94,0.8)", fontSize: 11 }}
              tickFormatter={(v) => formatBytes(Number(v))}
              domain={[
                (dataMin) => Math.max(0, dataMin * 0.9),
                (dataMax) => (dataMax === 0 ? 1 : dataMax * 1.1),
              ]}
            />
            <Tooltip
              content={
                <TooltipBox formatter={(p) => formatBps(Number(p.value))} />
              }
            />
            <Legend
              wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
            />
            <Area
              yAxisId="rx"
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
              yAxisId="tx"
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
  );
}
