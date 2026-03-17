interface InfoCardProps {
  children: React.ReactNode;
  color?: string;
}

export function InfoCard({
  children,
  color = "var(--accent-primary)",
}: InfoCardProps) {
  return (
    <div
      className="mt-4 rounded-xl border p-4 font-body text-sm leading-[1.8] text-text-secondary [&_strong]:text-accent-primary"
      style={{
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
        background: `color-mix(in srgb, ${color} 5%, transparent)`,
      }}
    >
      {children}
    </div>
  );
}
