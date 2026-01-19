import { pct } from "./utils";
import { Tone } from "./types";

export function Meter({
  value,
  labelLeft,
  labelRight,
  tone,
}: {
  value: number | null | undefined; // 0..100
  labelLeft?: string;
  labelRight?: string;
  tone: Tone;
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
