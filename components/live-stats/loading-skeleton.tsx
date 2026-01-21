import { Card, CardContent, CardHeader } from "@/components/card";
import { StatusPill } from "./status-pill";

export function LoadingSkeleton({ connected }: { connected: boolean }) {
  const pageBg =
    "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/80 p-6 shadow-2xl before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.18] before:content-[''] before:[background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] before:[background-size:48px_48px]";

  const glow =
    "pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),rgba(168,85,247,0.10),rgba(0,0,0,0))] blur-3xl";

  return (
    <div className={pageBg}>
      <div className={glow} />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Live Stats</div>
          <div className="mt-1 text-xs text-zinc-400">
            Waiting for the first realtime payload…
          </div>
        </div>
        <StatusPill
          label={connected ? "LIVE (no data yet)" : "DISCONNECTED"}
          tone={connected ? "warn" : "bad"}
        />
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
