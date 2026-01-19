export function TooltipBox({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
  formatter?: (p: any) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-zinc-100">{String(label ?? "")}</div>
      <div className="mt-1 space-y-1 text-zinc-300">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">{p.name ?? p.dataKey}</span>
            <span className="font-semibold">
              {formatter ? formatter(p) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
