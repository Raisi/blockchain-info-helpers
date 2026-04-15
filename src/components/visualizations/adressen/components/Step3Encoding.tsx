import { bytesToHex } from "@noble/hashes/utils";
import { ByteMap } from "./ByteMap";

interface Step3EncodingProps {
  hash160: Uint8Array;
  p2pkhChecksum: Uint8Array;
  p2pkhAddress: string;
  p2wpkhAddress: string;
}

export function Step3Encoding({
  hash160,
  p2pkhChecksum,
  p2pkhAddress,
  p2wpkhAddress,
}: Step3EncodingProps) {
  const hash160Hex = bytesToHex(hash160);
  const checksumHex = bytesToHex(p2pkhChecksum);

  return (
    <div className="space-y-5">
      <div className="flex gap-5 rounded-[14px] border border-[var(--border-active)] p-6 items-start">
        <div className="flex-shrink-0 font-mono text-lg leading-none text-white">≡</div>
        <div className="flex-1">
          <div className="mb-2 font-sans text-xl font-extrabold text-white">
            Schritt 3: Encoding Fork
          </div>
          <div className="text-[15px] leading-[1.8] text-[var(--text-secondary)]">
            Aus demselben Hash160 entstehen <strong className="text-[var(--accent-primary)]">zwei verschiedene Adressformate</strong> —
            je nach Encoding-Verfahren.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Left — P2PKH / Base58Check */}
        <div className="rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/[0.05] p-5 space-y-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--accent-primary)]">
            Base58Check — P2PKH
          </div>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="w-4 font-mono text-[var(--accent-primary)]">1.</span>
              Prefix <span className="font-mono text-[var(--text-primary)]">0x00</span> voranstellen (21 Bytes)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 font-mono text-[var(--accent-primary)]">2.</span>
              SHA256(SHA256(versioned)) → erste 4 Bytes = Checksum
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 font-mono text-[var(--accent-primary)]">3.</span>
              25 Bytes mit Base58 kodieren
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Byte-Karte (25 Bytes)
            </div>
            <ByteMap
              segments={[
                {
                  label: "00",
                  hex: "00",
                  colorBg: "bg-[var(--accent-primary)]/15",
                  colorText: "text-[var(--accent-primary)]",
                  chipLabel: "Version (1B)",
                },
                {
                  label: "hash160",
                  hex: hash160Hex,
                  colorBg: "bg-[var(--border-active)]/40",
                  colorText: "text-[var(--text-primary)]",
                  chipLabel: "Payload (20B)",
                },
                {
                  label: "checksum",
                  hex: checksumHex,
                  colorBg: "bg-[var(--accent-warning)]/15",
                  colorText: "text-[var(--accent-warning)]",
                  chipLabel: "Checksum (4B)",
                },
              ]}
            />
          </div>

          <div className="rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/[0.06] p-3">
            <div className="mb-1 font-mono text-[10px] text-[var(--text-muted)]">P2PKH ADRESSE</div>
            <div className="break-all font-mono text-sm font-bold text-[var(--accent-primary)]">
              {p2pkhAddress}
            </div>
          </div>
        </div>

        {/* Right — P2WPKH / Bech32 */}
        <div className="rounded-xl border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/[0.05] p-5 space-y-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--accent-secondary)]">
            Bech32 — P2WPKH
          </div>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="w-4 font-mono text-[var(--accent-secondary)]">1.</span>
              Hash160 in 5-Bit-Gruppen umwandeln
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 font-mono text-[var(--accent-secondary)]">2.</span>
              Witness Version <span className="font-mono text-[var(--text-primary)]">0x00</span> voranstellen
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 font-mono text-[var(--accent-secondary)]">3.</span>
              Bech32 mit Präfix <span className="font-mono text-[var(--text-primary)]">&quot;bc&quot;</span> kodieren
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Witness Program
            </div>
            <ByteMap
              segments={[
                {
                  label: "00",
                  hex: "00",
                  colorBg: "bg-[var(--accent-secondary)]/15",
                  colorText: "text-[var(--accent-secondary)]",
                  chipLabel: "Witness v0",
                },
                {
                  label: "hash160",
                  hex: hash160Hex,
                  colorBg: "bg-[var(--border-active)]/40",
                  colorText: "text-[var(--text-primary)]",
                  chipLabel: "Witness Program (20B)",
                },
              ]}
            />
          </div>

          <div className="rounded-lg border border-[var(--accent-secondary)]/20 bg-[var(--accent-secondary)]/[0.06] p-3">
            <div className="mb-1 font-mono text-[10px] text-[var(--text-muted)]">P2WPKH ADRESSE</div>
            <div className="break-all font-mono text-sm font-bold text-[var(--accent-secondary)]">
              {p2wpkhAddress}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
