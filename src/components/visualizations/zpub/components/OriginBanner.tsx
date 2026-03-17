"use client";

import Link from "next/link";

export function OriginBanner() {
  return (
    <div className="mb-6 rounded-xl border border-border-subtle bg-bg-card p-4">
      <div className="mb-2 font-code text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
        DERIVATIONSPFAD
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 font-code text-lg">
        <span className="text-text-secondary">m</span>
        <span className="text-text-muted">/</span>
        <span className="font-bold text-accent-secondary">84&apos;</span>
        <span className="text-text-muted">/</span>
        <span className="font-bold text-accent-warning">0&apos;</span>
        <span className="text-text-muted">/</span>
        <span className="font-bold text-accent-primary">0&apos;</span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/bip39"
          className="rounded-lg border border-border-subtle bg-bg-primary px-3 py-1.5 text-text-secondary transition-all hover:border-accent-primary hover:text-accent-primary"
        >
          Mnemonic → Seed →
        </Link>
        <Link
          href="/bip-visualizer"
          className="rounded-lg border border-border-subtle bg-bg-primary px-3 py-1.5 text-text-secondary transition-all hover:border-accent-secondary hover:text-accent-secondary"
        >
          BIP32 Derivation →
        </Link>
        <Link
          href="/elliptic-curves"
          className="rounded-lg border border-border-subtle bg-bg-primary px-3 py-1.5 text-text-secondary transition-all hover:border-accent-warning hover:text-accent-warning"
        >
          Elliptische Kurven →
        </Link>
      </div>
      <div className="mt-2 text-[11px] text-text-muted">
        Die vorherigen Schritte (Mnemonic → Seed → Master Key → Hardened Derivation) werden hier im Hintergrund ausgeführt.
      </div>
    </div>
  );
}
