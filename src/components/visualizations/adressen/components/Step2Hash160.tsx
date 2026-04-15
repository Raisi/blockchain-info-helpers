import { bytesToHex } from "@noble/hashes/utils";
import { MonoRow } from "./MonoRow";

interface Step2Hash160Props {
  pubkeyHex: string;
  sha256Result: Uint8Array;
  hash160: Uint8Array;
}

export function Step2Hash160({ pubkeyHex, sha256Result, hash160 }: Step2Hash160Props) {
  return (
    <div className="space-y-5">
      <div className="flex gap-5 rounded-[14px] border border-[var(--accent-secondary)]/25 bg-[var(--accent-secondary)]/[0.06] p-6 items-start">
        <div className="flex-shrink-0 font-mono text-lg leading-none text-[var(--accent-secondary)]">
          H160
        </div>
        <div className="flex-1">
          <div className="mb-2 font-sans text-xl font-extrabold text-white">
            Schritt 2: Hash160
          </div>
          <div className="text-[15px] leading-[1.8] text-[var(--text-secondary)]">
            <strong className="text-white">RIPEMD160(SHA256(pubkey))</strong> — auch &quot;Hash160&quot; genannt.
            Das Ergebnis ist nur 20 Bytes groß und bildet das Kernstück jeder Bitcoin-Adresse.
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
        <MonoRow
          label="Input (Public Key)"
          value={pubkeyHex}
          color="text-[var(--text-secondary)]"
        />
        <div className="border-t border-[var(--border-subtle)]" />
        <MonoRow
          label="SHA256"
          value={bytesToHex(sha256Result)}
          color="text-[var(--accent-primary)]"
        />
        <div className="border-t border-[var(--border-subtle)]" />
        <MonoRow
          label="RIPEMD160 (Hash160)"
          value={bytesToHex(hash160)}
          color="text-[var(--accent-secondary)]"
        />
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-sm leading-[1.8] text-[var(--text-secondary)]">
        Die doppelte Hashfunktion schützt vor möglichen Schwächen in SHA256 allein
        und reduziert die Adressgröße auf 20 Bytes — kompakt und kollisionsresistent.
      </div>
    </div>
  );
}
