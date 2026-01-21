import { PiModelCanvas } from "../pi-model-canvas";
import { StatusPill } from "./status-pill";
import { Tone } from "./types";
import { formatUptime } from "./utils";

export function HeaderSection({
  sys,
  freshnessTone,
  error,
}: {
  sys: any;
  freshnessTone: Tone;
  error: string | null;
}) {
  return (
    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Status Dashboard
          </h1>

          <StatusPill
            label={
              freshnessTone === "good"
                ? "LIVE"
                : freshnessTone === "warn"
                  ? "LIVE (lagging)"
                  : freshnessTone === "bad"
                    ? "OFFLINE / STALE"
                    : "LIVE"
            }
            tone={freshnessTone}
          />
        </div>

        <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-zinc-400 md:grid-cols-2">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
            Host: <span className="font-semibold text-zinc-200">Raspberry Pi 5 Model B Rev 1.0</span>
          </span>

          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
            CPU: <span className="font-semibold text-zinc-200">Cortex-A76 / 4 Cores / 2400MHz</span>
          </span>

          <span className="inline-flex items-center gap-2 whitespace-nowrap min-w-[180px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
            OS
            <span className="font-semibold text-zinc-200">
              Debian GNU/Linux 13 (trixie)
            </span>
          </span>

          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
            Uptime:{" "}
            <span className="font-semibold text-zinc-200">
              {formatUptime(sys?.uptimeSeconds)}
            </span>
          </span>

        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            ⚠️ {error}
          </div>
        ) : null}

        <PiModelCanvas />
      </div>
    </div>
  );
}
