import { useEffect, useRef, useState } from "react";
import { CombinedStats } from "@/shared/types";
import { devLog } from "@/lib/utils";
import { HistoryPoint, HISTORY_MAX } from "./types";
import { formatTimeLabel } from "./utils";

export function useStatsStream() {
  const [stats, setStats] = useState<CombinedStats | null>(null);
  const [lastGood, setLastGood] = useState<CombinedStats | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastNetRef = useRef<{ t: number; rx: number; tx: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventSource = new EventSource("/api/stats");
    devLog("🔵 [stream/client] LiveStats eventSource:", eventSource);

    eventSource.onopen = () => {
      devLog("🔵 [stream/client] Connection opened.");
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event: MessageEvent<string>) => {
      try {
        if (!event.data) return;

        const parsed = JSON.parse(event.data) as CombinedStats | null;
        devLog("🔵 [stream/client] message received:", parsed);

        setStats(parsed);

        if (parsed) {
          setLastGood(parsed);

          // Build history point
          const epoch =
            Date.parse((parsed as any)?.timestamp ?? "") || Date.now();

          const cpu = (parsed as any)?.host?.cpu?.usagePercent ?? 0;
          const mem = (parsed as any)?.host?.memory?.usagePercent ?? 0;

          const tempAvailable =
            (parsed as any)?.host?.temperature?.available ?? false;
          const tempVal = tempAvailable
            ? (parsed as any)?.host?.temperature?.cpuCelsius
            : null;

          // Network (sum interfaces)
          const ifaces: any[] =
            (parsed as any)?.host?.network?.interfaces ?? [];
          const rxTotal = ifaces.reduce(
            (sum, it) => sum + (it?.rxBytes ?? 0),
            0,
          );
          const txTotal = ifaces.reduce(
            (sum, it) => sum + (it?.txBytes ?? 0),
            0,
          );

          let rxRate: number | null = null;
          let txRate: number | null = null;
          const last = lastNetRef.current;
          if (last) {
            const dt = Math.max(0.001, (epoch - last.t) / 1000);
            const drx = rxTotal - last.rx;
            const dtx = txTotal - last.tx;
            rxRate = drx >= 0 ? drx / dt : null;
            txRate = dtx >= 0 ? dtx / dt : null;
          }
          lastNetRef.current = { t: epoch, rx: rxTotal, tx: txTotal };

          const point: HistoryPoint = {
            t: epoch,
            label: formatTimeLabel(epoch),
            cpu,
            mem,
            temp: tempVal ?? null,
            rxRate,
            txRate,
          };

          setHistory((prev) => {
            const next = [...prev, point];
            return next.length > HISTORY_MAX
              ? next.slice(next.length - HISTORY_MAX)
              : next;
          });
        }
      } catch (e) {
        devLog("🔴 [stream/client] Failed to parse stats:", e);
        setError("Failed to parse stats");
      }
    };

    eventSource.onerror = (err) => {
      devLog("🔴 [stream/client] SSE error:", err);
      setConnected(false);
      setError("Connection lost. Reconnecting...");
    };

    return () => {
      devLog(
        "🔴 [stream/client] LiveStats component unmounted. Closing eventSource.",
      );
      eventSource.close();
    };
  }, []);

  return {
    stats,
    lastGood,
    history,
    connected,
    error,
  };
}
