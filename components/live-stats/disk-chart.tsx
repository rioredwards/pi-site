import { ChartWrap } from "./chart-wrap";
import { formatBytes, pct } from "./utils";

export function DiskChart({ disks }: { disks: any[] }) {
  const primaryDisk = disks[0];
  const usagePercent = pct(primaryDisk?.usagePercent) ?? 0;
  const freeBytes = primaryDisk?.freeBytes ?? 0;

  // Calculate total and used bytes from free bytes and usage percent
  // total = freeBytes / (1 - usagePercent/100)
  const totalBytes =
    usagePercent < 100 && freeBytes > 0
      ? freeBytes / (1 - usagePercent / 100)
      : freeBytes;
  const usedBytes = totalBytes - freeBytes;

  const tone =
    usagePercent < 70 ? "good" : usagePercent < 88 ? "warn" : "bad";
  const barColor =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <ChartWrap
      title="Disk Usage"
      subtitle={primaryDisk?.mountPoint ?? "Primary mount"}
    >
      <div className="flex h-[260px] min-h-[200px] flex-col justify-center gap-6 px-2">
        {/* Main percentage display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-zinc-100">
            {usagePercent.toFixed(1)}%
          </div>
          <div className="mt-1 text-sm text-zinc-400">used</div>
        </div>

        {/* Horizontal bar */}
        <div className="space-y-2">
          <div className="h-6 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${barColor} transition-all duration-500`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          {/* Labels */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${barColor}`} />
              <span className="text-zinc-400">
                Used:{" "}
                <span className="font-semibold text-zinc-200">
                  {formatBytes(usedBytes)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="text-zinc-400">
                Free:{" "}
                <span className="font-semibold text-zinc-200">
                  {formatBytes(freeBytes)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Total capacity */}
        <div className="text-center text-xs text-zinc-500">
          Total capacity: {formatBytes(totalBytes)}
        </div>
      </div>
    </ChartWrap>
  );
}
