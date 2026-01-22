import { useEffect, useMemo, useState } from "react";
import { CombinedStats } from "../../shared/types";
import { getAgeSeconds, getFreshnessTone, parseEffectiveTimestamp } from "./live-stats-utils";
import { StatusPill } from "./status-pill";

export function FreshnessStatusPill({
  connected,
  effective,
  label,
}: {
  connected: boolean;
  effective: CombinedStats | null;
  label: string;
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
    <StatusPill
      label={label}
      tone={freshnessTone}
    />
  );
}
