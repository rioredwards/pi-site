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
import { TooltipBox } from "./tooltip-box";
import { pct } from "./utils";

export function DiskChart({ disks }: { disks: any[] }) {
  const disksChart = disks.map((d) => ({
    name: d?.mountPoint ?? "—",
    used: pct(d?.usagePercent) ?? 0,
    free: 100 - (pct(d?.usagePercent) ?? 0),
  }));

  return (
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
  );
}
