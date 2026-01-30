import { Card, CardContent, CardHeader } from "@/components/card";
import { Meter } from "./meter";
import { clamp, formatBytes, formatPercent } from "./utils";

export function KpiCards({
  cpu,
  memory,
  disks,
  temp,
}: {
  cpu: any;
  memory: any;
  disks: any[];
  temp: any;
}) {
  return (
    <div className="relative mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="mr-2 text-xs font-medium text-zinc-400">CPU</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {formatPercent(cpu?.usagePercent)}
            </div>
            <div className="text-xs text-zinc-500">
              {cpu?.cores ? `${cpu.cores} cores` : ""}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Meter
            value={cpu?.usagePercent ?? 0}
            tone={
              (cpu?.usagePercent ?? 0) < 55
                ? "good"
                : (cpu?.usagePercent ?? 0) < 80
                  ? "warn"
                  : "bad"
            }
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
          <div className="mr-2 text-xs font-medium text-zinc-400">Memory</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {formatPercent(memory?.usagePercent)}
            </div>
            <div className="text-xs text-zinc-500">
              {formatBytes(memory?.usedBytes)} /{" "}
              {formatBytes(memory?.totalBytes)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Meter
            value={memory?.usagePercent ?? 0}
            tone={
              (memory?.usagePercent ?? 0) < 65
                ? "good"
                : (memory?.usagePercent ?? 0) < 85
                  ? "warn"
                  : "bad"
            }
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
          <div className="mr-2 text-xs font-medium text-zinc-400">Disk</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-100">
            {disks.length ? formatPercent(disks[0]?.usagePercent) : "—"}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Meter
            value={disks.length ? disks[0]?.usagePercent : 0}
            tone={
              (disks[0]?.usagePercent ?? 0) < 70
                ? "good"
                : (disks[0]?.usagePercent ?? 0) < 88
                  ? "warn"
                  : "bad"
            }
            labelLeft={
              disks[0]?.mountPoint
                ? `Mount ${disks[0].mountPoint}`
                : "Primary mount"
            }
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
          <div className="mr-2 text-xs font-medium text-zinc-400">
            Temperature
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-zinc-100">
              {temp?.available
                ? `${Number(temp?.cpuCelsius ?? 0).toFixed(1)}°C`
                : "—"}
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
                ? clamp(
                    ((Number(temp?.cpuCelsius ?? 0) - 25) / (85 - 25)) * 100,
                    0,
                    100,
                  )
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
            labelRight={
              temp?.available
                ? `${Number(temp?.cpuCelsius ?? 0).toFixed(1)}°C`
                : "—"
            }
          />
          <div className="text-[11px] text-zinc-500">Throttles at 85°C</div>
        </CardContent>
      </Card>
    </div>
  );
}
