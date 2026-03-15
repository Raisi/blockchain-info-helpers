export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-primary py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-sm text-text-muted">
            Blockchain<span className="text-accent-primary">Visualizer</span>
          </p>
          <p className="text-xs text-text-muted">
            Nur zu Lernzwecken. Keine Anlageberatung. Verwende keine hier
            generierten Schlüssel für echte Wallets.
          </p>
        </div>
      </div>
    </footer>
  );
}
