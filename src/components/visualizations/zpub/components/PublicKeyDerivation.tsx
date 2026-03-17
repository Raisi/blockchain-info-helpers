"use client";

import { toHex, fmtHex } from "../crypto-utils";
import { HexDisplay } from "./HexDisplay";
import { InfoCard } from "./InfoCard";

interface PublicKeyDerivationProps {
  accountPrivKey: Uint8Array;
  accountPubKey: Uint8Array;
}

export function PublicKeyDerivation({
  accountPrivKey,
  accountPubKey,
}: PublicKeyDerivationProps) {
  return (
    <div>
      <div data-zpub-animate>
        <div className="mb-3 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
          INPUT — ACCOUNT PRIVATE KEY (32 BYTES)
        </div>
        <HexDisplay
          bytes={accountPrivKey}
          colorClass="bg-accent-secondary/20 text-[#c4b5fd]"
        />
      </div>

      <div data-zpub-animate>
        <div className="my-4 flex justify-center py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-active bg-bg-card text-text-muted">
            ↓
          </div>
        </div>
        <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/[0.06] p-5">
          <div className="mb-2 font-code text-[10px] font-bold uppercase tracking-[2px] text-accent-primary">
            OPERATION — EC-MULTIPLIKATION (SECP256K1)
          </div>
          <div className="flex items-center justify-center gap-3 py-3 font-code text-xl">
            <span className="text-[#34d399]">P</span>
            <span className="text-text-muted">=</span>
            <span className="text-[#c4b5fd]">k</span>
            <span className="text-text-muted">·</span>
            <span className="text-accent-primary">G</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-bg-primary p-2">
              <div className="font-code text-[10px] text-text-muted">P</div>
              <div className="text-[#34d399]">Public Key</div>
            </div>
            <div className="rounded-lg bg-bg-primary p-2">
              <div className="font-code text-[10px] text-text-muted">k</div>
              <div className="text-[#c4b5fd]">Private Key</div>
            </div>
            <div className="rounded-lg bg-bg-primary p-2">
              <div className="font-code text-[10px] text-text-muted">G</div>
              <div className="text-accent-primary">Generator-Punkt</div>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-active bg-bg-card text-text-muted">
            ↓
          </div>
        </div>
      </div>

      <div data-zpub-animate>
        <div className="mb-3 mt-7 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted">
          OUTPUT — COMPRESSED PUBLIC KEY (33 BYTES)
        </div>
        <HexDisplay
          bytes={accountPubKey}
          colorClass="bg-[#34d399]/15 text-[#34d399]"
        />

        <div className="mt-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div className="rounded-lg border border-border-subtle bg-bg-card-hover p-3">
            <div className="font-code text-[10px] tracking-wider text-text-muted">
              PREFIX
            </div>
            <div className="mt-1 font-code text-lg font-bold text-[#34d399]">
              0x{toHex(accountPubKey).slice(0, 2)}
            </div>
            <div className="mt-0.5 text-xs text-text-secondary">
              {accountPubKey[0] === 0x02 ? "y gerade" : "y ungerade"}
            </div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-card-hover p-3">
            <div className="font-code text-[10px] tracking-wider text-text-muted">
              X-KOORDINATE
            </div>
            <div className="mt-1 font-code text-xs text-[#34d399]">
              {fmtHex(toHex(accountPubKey).slice(2), 16)}
            </div>
            <div className="mt-0.5 text-xs text-text-secondary">32 Bytes</div>
          </div>
        </div>
      </div>

      <div data-zpub-animate>
        <InfoCard>
          <strong>Compressed Public Key:</strong> Nur die x-Koordinate + 1 Byte
          Prefix (02 oder 03 je nach Parität von y). Das spart 32 Bytes
          gegenüber dem unkomprimierten Format. Die Kurve selbst wird auf der{" "}
          <a href="/elliptic-curves" className="underline hover:text-accent-primary">
            Elliptic Curves
          </a>{" "}
          Seite erklärt.
        </InfoCard>
      </div>
    </div>
  );
}
