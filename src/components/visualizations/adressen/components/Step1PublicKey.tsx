interface Step1PublicKeyProps {
  pubkeyInput: string;
  pubkeyValid: boolean;
  onInputChange: (val: string) => void;
  onRandomize: () => void;
}

export function Step1PublicKey({
  pubkeyInput,
  pubkeyValid,
  onInputChange,
  onRandomize,
}: Step1PublicKeyProps) {
  return (
    <div className="space-y-5">
      <div data-hero-animate className="flex gap-5 rounded-[14px] border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/[0.06] p-6 items-start">
        <div className="flex-shrink-0 font-mono text-2xl leading-none text-[var(--accent-primary)]">
          K
        </div>
        <div className="flex-1">
          <div className="mb-2 font-sans text-xl font-extrabold text-white">
            Schritt 1: Public Key
          </div>
          <div className="text-[15px] leading-[1.8] text-[var(--text-secondary)]">
            Ein komprimierter secp256k1 Public Key ist 33 Bytes lang und beginnt
            mit <span className="font-mono text-[var(--accent-primary)]">02</span> (gerade y) oder{" "}
            <span className="font-mono text-[var(--accent-primary)]">03</span> (ungerade y).
          </div>
        </div>
      </div>

      <div data-hero-animate>
        <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-muted)]">
          Compressed Public Key (33 Bytes / 66 Hex)
        </div>
        <div className="relative">
          <textarea
            className={`w-full resize-none rounded-xl border bg-[var(--bg-primary)] p-4 font-mono text-sm leading-[1.7] text-[var(--text-primary)] outline-none transition-colors ${
              pubkeyInput && !pubkeyValid
                ? "border-[var(--accent-danger)] focus:border-[var(--accent-danger)]"
                : "border-[var(--border-subtle)] focus:border-[var(--accent-primary)]"
            }`}
            rows={2}
            value={pubkeyInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="02 oder 03 gefolgt von 64 Hex-Zeichen..."
            spellCheck={false}
          />
          {pubkeyInput && !pubkeyValid && (
            <div className="mt-1.5 text-xs text-[var(--accent-danger)]">
              Ungültiger Public Key — muss mit 02 oder 03 beginnen und genau 66 Hex-Zeichen lang sein.
            </div>
          )}
        </div>
      </div>

      <div data-hero-animate className="flex flex-wrap gap-2">
        <button
          onClick={onRandomize}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-active)] bg-transparent px-4 py-2 font-mono text-sm text-[var(--text-secondary)] transition-[border-color,color] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          ↻ Zufälliger Key
        </button>
      </div>

      <div data-hero-animate className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-sm leading-[1.8] text-[var(--text-secondary)]">
        Keinen Public Key zur Hand?{" "}
        <a href="/bip-visualizer" className="text-[var(--accent-primary)] underline underline-offset-2 hover:opacity-80">
          BIP Visualizer
        </a>{" "}
        oder{" "}
        <a href="/zpub" className="text-[var(--accent-primary)] underline underline-offset-2 hover:opacity-80">
          zpub-Seite
        </a>{" "}
        — dort wird ein Public Key schrittweise abgeleitet.
      </div>
    </div>
  );
}
