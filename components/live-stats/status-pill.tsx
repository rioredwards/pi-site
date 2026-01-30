import { Tone } from "./types";

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
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
            ? "h-2 w-2 animate-pulse rounded-full bg-emerald-400"
            : tone === "warn"
              ? "h-2 w-2 animate-pulse rounded-full bg-amber-400"
              : tone === "bad"
                ? "h-2 w-2 animate-pulse rounded-full bg-rose-400"
                : "h-2 w-2 rounded-full bg-zinc-400"
        }
      />
      {label}
    </span>
  );
}
