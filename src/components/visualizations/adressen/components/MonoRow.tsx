export function MonoRow({
  label,
  value,
  color = "text-[var(--text-primary)]",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <div className="w-[180px] flex-shrink-0 font-mono text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--text-muted)]">
        {label}
      </div>
      <div className={`break-all font-mono text-sm leading-[1.7] ${color}`}>
        {value}
      </div>
    </div>
  );
}
