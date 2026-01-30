export function StatRow({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-base">{icon}</span> : null}
          <div className="text-xs font-medium text-zinc-400">{label}</div>
        </div>
        {sub ? (
          <div className="mt-1 text-[11px] leading-snug text-zinc-500">
            {sub}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 text-right text-sm font-semibold text-zinc-100">
        {value}
      </div>
    </div>
  );
}
