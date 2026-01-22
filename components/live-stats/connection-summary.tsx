import { Card, CardContent, CardHeader } from "@/components/card";
import { useEffect, useMemo, useState } from "react";
import { CombinedStats } from "../../shared/types";
import { getAgeSeconds, getFreshnessTone, parseEffectiveTimestamp } from "./live-stats-utils";
import { Meter } from "./meter";
import { StatRow } from "./stat-row";
import { clamp } from "./utils";

export function ConnectionSummary({
  connected,
  effective,
}: {
  connected: boolean;
  effective: CombinedStats | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  // tick clock for "x seconds ago"
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const ageSeconds = useMemo(() => {
    const lastUpdatedMs = parseEffectiveTimestamp(effective);
    return lastUpdatedMs ? getAgeSeconds(lastUpdatedMs, now) : null;
  }, [now, effective]);

  const freshnessTone = getFreshnessTone(connected, ageSeconds ?? 0);

  return (
    <div className="w-full lg:max-w-[550px]">
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="text-sm font-semibold text-zinc-100 mr-2 mb-0">Realtime</div>
          <div className="text-xs text-zinc-400">
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
