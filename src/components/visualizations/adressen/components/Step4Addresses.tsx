import { CopyButton } from "./CopyButton";

interface Step4AddressesProps {
  p2pkhAddress: string;
  p2wpkhAddress: string;
  onRestart: () => void;
}

export function Step4Addresses({ p2pkhAddress, p2wpkhAddress, onRestart }: Step4AddressesProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-5 rounded-[14px] border border-[var(--accent-success)]/25 bg-[var(--accent-success)]/[0.06] p-6 items-start">
        <div className="flex-shrink-0 font-mono text-lg leading-none text-[var(--accent-success)]">
          ✓
        </div>
        <div className="flex-1">
          <div className="mb-2 font-sans text-xl font-extrabold text-white">
            Schritt 4: Adressen
          </div>
          <div className="text-[15px] leading-[1.8] text-[var(--text-secondary)]">
            Beide Adressen repräsentieren exakt denselben Public Key — sie unterscheiden
            sich nur im Format und der Effizienz.
          </div>
        </div>
      </div>

      {/* P2PKH */}
      <div className="rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--bg-card)] p-6 space-y-3">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--accent-primary)]">
          Legacy — P2PKH (Base58Check)
        </div>
        <div className="break-all font-mono text-xl font-bold leading-[1.6] text-[var(--accent-primary)]">
          {p2pkhAddress}
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          Beginnt immer mit <span className="font-mono text-white">1</span> —
          ältestes Adressformat, kompatibel mit allen Wallets, höhere Transaktionsgebühren.
        </div>
        <CopyButton text={p2pkhAddress} />
      </div>

      {/* P2WPKH */}
      <div className="rounded-xl border border-[var(--accent-secondary)]/30 bg-[var(--bg-card)] p-6 space-y-3">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--accent-secondary)]">
          Native SegWit — P2WPKH (Bech32)
        </div>
        <div className="break-all font-mono text-xl font-bold leading-[1.6] text-[var(--accent-secondary)]">
          {p2wpkhAddress}
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          Beginnt immer mit <span className="font-mono text-white">bc1q</span> —
          modernes Format (BIP-173), geringere Gebühren, eingebettete Fehlerkorrektur.
        </div>
        <CopyButton text={p2wpkhAddress} />
      </div>

      <button
        onClick={onRestart}
        className="w-full rounded-xl border border-[var(--border-active)] bg-transparent py-3 font-mono text-sm text-[var(--text-secondary)] transition-[border-color,color] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
      >
        ↻ Neuen Key generieren
      </button>
    </div>
  );
}
