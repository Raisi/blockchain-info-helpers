"use client";

export function HardenedComparison() {
  return (
    <div className="mt-6">
      <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-text-muted">
        Hardened vs. Non-Hardened
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Hardened */}
        <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-accent-danger/20 text-xs text-accent-danger">
              H
            </div>
            <div className="font-code text-sm font-bold text-accent-danger">
              Hardened
            </div>
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-danger">●</span>
              <span>Braucht den <strong className="text-text-primary">Private Key</strong> als HMAC-Input</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-danger">●</span>
              <span>Index ≥ 2³¹ (0x80000000)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-danger">●</span>
              <span>Child kann <strong className="text-text-primary">nicht</strong> aus Parent Public Key abgeleitet werden</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-danger">●</span>
              <span>Verwendet für: Purpose, Coin Type, Account</span>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-bg-primary p-2 font-code text-[10px] text-text-muted">
            HMAC(key=chain, data=0x00 ∥ privKey ∥ index)
          </div>
        </div>

        {/* Non-Hardened */}
        <div className="rounded-xl border border-accent-success/30 bg-accent-success/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-accent-success/20 text-xs text-accent-success">
              N
            </div>
            <div className="font-code text-sm font-bold text-accent-success">
              Non-Hardened
            </div>
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-success">●</span>
              <span>Nur <strong className="text-text-primary">Public Key</strong> als HMAC-Input nötig</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-success">●</span>
              <span>Index &lt; 2³¹ (normal: 0, 1, 2, ...)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-success">●</span>
              <span>Child <strong className="text-text-primary">kann</strong> aus Parent Public Key abgeleitet werden</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-success">●</span>
              <span>Verwendet für: Change/Receive Chain, Adress-Index</span>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-bg-primary p-2 font-code text-[10px] text-text-muted">
            HMAC(key=chain, data=pubKey ∥ index)
          </div>
        </div>
      </div>
    </div>
  );
}
