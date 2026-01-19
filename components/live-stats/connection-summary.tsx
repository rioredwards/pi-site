import { Card, CardContent, CardHeader } from "@/components/card";
import { Meter } from "./meter";
import { StatRow } from "./stat-row";
import { Tone } from "./types";
import { clamp } from "./utils";

export function ConnectionSummary({
  connected,
  ageSeconds,
  freshnessTone,
}: {
  connected: boolean;
  ageSeconds: number | null;
  freshnessTone: Tone;
}) {
  return (
    <div className="w-full md:w-[340px]">
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="text-sm font-semibold text-zinc-100">Realtime</div>
          <div className="mt-1 text-xs text-zinc-400">
            Streaming via SSE • Auto-updating charts
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow
            icon="🔌"
            label="Connection"
            value={connected ? "Connected" : "Disconnected"}
            sub={connected ? "Receiving events from /api/stats/stream" : "Waiting for reconnect…"}
          />
          <StatRow
            icon="⏱️"
            label="Freshness"
            value={
              ageSeconds == null
                ? "—"
                : ageSeconds < 3
                  ? "Hot"
                  : ageSeconds < 8
                    ? "Warm"
                    : "Stale"
            }
            sub="How recently the last payload arrived"
          />
          <div className="pt-2">
            <Meter
              value={ageSeconds == null ? 0 : clamp(100 - ageSeconds * 12.5, 0, 100)}
              tone={freshnessTone}
              labelLeft="Stream quality"
              labelRight={ageSeconds == null ? "—" : `${ageSeconds.toFixed(1)}s ago`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
