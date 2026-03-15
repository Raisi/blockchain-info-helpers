"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import {
  fullZpubDerivation,
  toHex,
  fmtHex,
  splitHex,
  VERSION_BYTES,
} from "./crypto-utils";
import { ZPUB_STEPS, DEFAULT_MNEMONIC, BYTE_FIELD_COLORS } from "./constants";
import type { DerivationLevel, SerializedKey } from "./types";

/* ── Sub-Components ── */

function StepNav({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="mb-8 flex items-center gap-0 overflow-x-auto">
      {ZPUB_STEPS.map((s, i) => {
        const isActive = currentStep === s.id;
        const isDone = s.id <= completedSteps;
        return (
          <div key={s.id} className="flex items-center">
            <button
              className={`flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-3 font-code text-sm transition-all ${
                isActive
                  ? "border-accent-secondary bg-accent-secondary/15 text-white"
                  : isDone
                    ? "border-accent-success/30 bg-bg-card text-text-secondary"
                    : "border-border-subtle bg-bg-card text-text-muted"
              } ${!isDone && !isActive ? "opacity-50" : "cursor-pointer"}`}
              onClick={() => {
                if (isDone || isActive) onStepClick(s.id);
              }}
            >
              <div
                className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-accent-secondary text-white"
                    : isDone
                      ? "bg-accent-success text-black"
                      : "bg-border-active text-text-muted"
                }`}
              >
                {isDone && !isActive ? "✓" : s.id}
              </div>
              <span className="hidden whitespace-nowrap sm:inline">{s.title}</span>
            </button>
            {i < ZPUB_STEPS.length - 1 && (
              <div
                className={`h-px w-6 flex-shrink-0 ${isDone ? "bg-accent-success" : "bg-border-subtle"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function HexDisplay({
  bytes,
  colorClass = "bg-accent-success/12 text-[#6ee7b7]",
  chunkSize = 8,
}: {
  bytes: Uint8Array;
  colorClass?: string;
  chunkSize?: number;
}) {
  return (
    <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm leading-8">
      {splitHex(toHex(bytes), chunkSize).map((c, i) => (
        <span
          key={i}
          className={`mr-1.5 mb-1 inline-block rounded px-2 py-1 transition-all hover:brightness-[1.4] ${colorClass}`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function ByteFieldDisplay({
  serialized,
}: {
  serialized: SerializedKey;
}) {
  const fields = [
    {
      key: "version",
      bytes: serialized.version,
      offset: 0,
      size: 4,
      value: "0x" + toHex(serialized.version).toUpperCase(),
    },
    {
      key: "depth",
      bytes: new Uint8Array([serialized.depth]),
      offset: 4,
      size: 1,
      value: `0x${serialized.depth.toString(16).padStart(2, "0")} (${serialized.depth})`,
    },
    {
      key: "fingerprint",
      bytes: serialized.fingerprint,
      offset: 5,
      size: 4,
      value: toHex(serialized.fingerprint),
    },
    {
      key: "childIndex",
      bytes: (() => {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setUint32(0, serialized.childIndex, false);
        return b;
      })(),
      offset: 9,
      size: 4,
      value: `0x${serialized.childIndex.toString(16).padStart(8, "0")}`,
    },
    {
      key: "chainCode",
      bytes: serialized.chainCode,
      offset: 13,
      size: 32,
      value: fmtHex(toHex(serialized.chainCode), 16),
    },
    {
      key: "publicKey",
      bytes: serialized.publicKey,
      offset: 45,
      size: 33,
      value: fmtHex(toHex(serialized.publicKey), 16),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="mb-4 text-xs text-text-muted">
        78-Byte Rohdaten — farblich nach Feld markiert:
      </div>
      {fields.map((f) => {
        const style = BYTE_FIELD_COLORS[f.key];
        return (
          <div
            key={f.key}
            className={`flex items-start gap-3 rounded-lg border border-border-subtle p-3 ${style.bg}`}
          >
            <div className="w-[160px] flex-shrink-0">
              <div className={`font-code text-xs font-bold ${style.text}`}>
                {style.label}
              </div>
              <div className="mt-0.5 font-code text-[10px] text-text-muted">
                Offset: {f.offset} · {f.size} Bytes
              </div>
            </div>
            <div className={`flex-1 break-all font-code text-xs ${style.text}`}>
              {f.value}
            </div>
          </div>
        );
      })}

      {/* Checksum */}
      <div className="flex items-start gap-3 rounded-lg border border-accent-danger/30 bg-accent-danger/10 p-3">
        <div className="w-[160px] flex-shrink-0">
          <div className="font-code text-xs font-bold text-accent-danger">
            {BYTE_FIELD_COLORS.checksum.label}
          </div>
          <div className="mt-0.5 font-code text-[10px] text-text-muted">
            SHA256(SHA256(78B))[0:4]
          </div>
        </div>
        <div className="flex-1 break-all font-code text-xs text-accent-danger">
          {toHex(serialized.checksum)}
        </div>
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-active bg-bg-card-hover p-3">
        <span className="font-code text-xs font-bold text-text-primary">
          GESAMT: 82 Bytes
        </span>
        <span className="text-xs text-text-muted">
          (78 Rohdaten + 4 Checksum) → Base58Check
        </span>
      </div>
    </div>
  );
}

function VersionComparison({}: {
  serialized: SerializedKey;
}) {
  const [selectedVersion, setSelectedVersion] = useState("zpub");

  return (
    <div className="mt-6">
      <div className="mb-3 font-code text-xs font-bold uppercase tracking-[2px] text-text-muted">
        VERSION-BYTE VERGLEICH
      </div>
      <div className="mb-3 flex gap-1.5">
        {VERSION_BYTES.map((v) => (
          <button
            key={v.prefix}
            className={`flex-1 rounded-lg border px-3 py-2 font-code text-xs transition-all ${
              selectedVersion === v.prefix
                ? "border-[#fb7185] bg-[#fb7185]/12 text-[#fb7185]"
                : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-active"
            }`}
            onClick={() => setSelectedVersion(v.prefix)}
          >
            {v.prefix}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-border-subtle bg-bg-primary p-4">
        {VERSION_BYTES.map((v) => (
          <div
            key={v.prefix}
            className={`mb-2 last:mb-0 flex items-center gap-3 rounded-lg p-2.5 transition-all ${
              selectedVersion === v.prefix
                ? "border border-[#fb7185]/30 bg-[#fb7185]/5"
                : "opacity-40"
            }`}
          >
            <span className="w-12 font-code text-sm font-bold text-text-primary">
              {v.prefix}
            </span>
            <span className="font-code text-xs text-accent-primary">
              0x{v.versionHex}
            </span>
            <span className="flex-1 text-right text-xs text-text-secondary">
              {v.addressType}
            </span>
          </div>
        ))}
        <div className="mt-3 rounded-lg border border-border-subtle bg-bg-card-hover p-2.5 text-[11px] text-text-muted">
          Technisch identische Struktur — nur die 4 Version-Bytes unterscheiden
          sich. Das bestimmt downstream welcher Adresstyp generiert wird.
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function ZpubVisualizer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [mnemonic, setMnemonic] = useState(DEFAULT_MNEMONIC);
  const [passphrase, setPassphrase] = useState("");
  const [computing, setComputing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);

  // Derivation results
  const [seed, setSeed] = useState<Uint8Array | null>(null);
  const [masterPriv, setMasterPriv] = useState<Uint8Array | null>(null);
  const [masterChain, setMasterChain] = useState<Uint8Array | null>(null);
  const [derivationLevels, setDerivationLevels] = useState<DerivationLevel[]>([]);
  const [accountPubKey, setAccountPubKey] = useState<Uint8Array | null>(null);
  const [serialized, setSerialized] = useState<SerializedKey | null>(null);
  const [addresses, setAddresses] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Run full derivation on mnemonic/passphrase change
  useEffect(() => {
    const words = mnemonic.trim().split(/\s+/).filter(Boolean);
    if (words.length < 12) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComputing(true);
    fullZpubDerivation(mnemonic, passphrase)
      .then((result) => {
        setSeed(result.seed);
        setMasterPriv(result.masterPriv);
        setMasterChain(result.masterChain);
        setDerivationLevels(result.derivationLevels);
        setAccountPubKey(result.accountPubKey);
        setSerialized(result.serialized);
        setAddresses(result.addresses);
        setCompletedSteps(5);
        setComputing(false);
      })
      .catch((e) => {
        console.error("zpub derivation error:", e);
        setComputing(false);
      });
  }, [mnemonic, passphrase]);

  // Step entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-zpub-animate]", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [currentStep]);

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-3 mt-7 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted first:mt-0">
      {children}
    </div>
  );

  const InfoCard = ({
    children,
    color = "var(--accent-primary)",
  }: {
    children: React.ReactNode;
    color?: string;
  }) => (
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div
                className="mb-6 flex gap-5 rounded-[14px] border border-accent-warning/25 bg-accent-warning/[0.06] p-6 items-start"
              >
                <div className="flex-shrink-0 text-4xl leading-none">📝</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 1: Mnemonic → Seed
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    PBKDF2-HMAC-SHA512 wandelt deine Mnemonic-Wörter + optionale
                    Passphrase in einen 512-Bit Seed um. 2048 Iterationen machen
                    Brute-Force extrem langsam.
                  </div>
                </div>
              </div>
            </div>

            <div data-zpub-animate>
              <Label>MNEMONIC EINGABE</Label>
              <textarea
                className="w-full resize-y rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm leading-[1.7] text-text-primary outline-none transition-colors focus:border-accent-secondary"
                rows={3}
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="12–24 BIP39 Wörter..."
              />
            </div>

            <div data-zpub-animate>
              <Label>OPTIONALE PASSPHRASE</Label>
              <input
                className="w-full rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm text-text-primary outline-none transition-colors focus:border-accent-secondary"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder='leer = Salt ist nur "mnemonic"'
              />
            </div>

            <div data-zpub-animate>
              <div className="my-4 flex items-center gap-5 rounded-xl border border-border-subtle bg-bg-primary p-5">
                <div className="text-[32px]">🔁</div>
                <div>
                  <div className="font-body text-lg font-bold text-accent-warning">
                    PBKDF2-HMAC-SHA512
                  </div>
                  <div className="text-sm text-text-secondary">
                    Password = Mnemonic · Salt = &quot;mnemonic&quot;
                    {passphrase ? ` + "${passphrase}"` : ""} · 2048 Iterationen →
                    512 Bit
                  </div>
                </div>
              </div>
            </div>

            {seed && (
              <div data-zpub-animate>
                <Label>SEED OUTPUT (64 BYTES)</Label>
                <HexDisplay bytes={seed} />
                <InfoCard color="var(--accent-warning)">
                  <strong>Der Seed ist nicht der Private Key</strong> — er ist der
                  Rohstoff für alles Weitere. Aus ihm wird der Master Key
                  abgeleitet.
                </InfoCard>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-success/25 bg-accent-success/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-4xl leading-none">🔐</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 2: Seed → Master Keys
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    HMAC-SHA512 mit dem festen Key &quot;Bitcoin seed&quot; spaltet den
                    Seed in Master Private Key (32 Bytes) + Master Chain Code (32
                    Bytes).
                  </div>
                </div>
              </div>
            </div>

            {seed && (
              <div data-zpub-animate>
                <Label>INPUT — SEED (64 BYTES)</Label>
                <div className="rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm text-[#6ee7b7]">
                  {fmtHex(toHex(seed), 40)}
                </div>
              </div>
            )}

            <div data-zpub-animate>
              <div className="my-4 flex items-center gap-5 rounded-xl border border-border-subtle bg-bg-primary p-5">
                <div className="text-[32px]">🔐</div>
                <div>
                  <div className="font-body text-lg font-bold text-accent-success">
                    HMAC-SHA512
                  </div>
                  <div className="text-sm text-text-secondary">
                    Key = &quot;Bitcoin seed&quot; (fest im BIP32 Standard) · Data = Seed
                    (64 Bytes)
                  </div>
                </div>
              </div>
            </div>

            {masterPriv && masterChain && (
              <div data-zpub-animate>
                <Label>OUTPUT — IL ∥ IR</Label>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <div className="rounded-xl border border-accent-secondary/40 bg-bg-primary p-5">
                    <div className="mb-3 font-code text-xs font-bold uppercase tracking-wider text-accent-secondary">
                      IL — Master Private Key (32B)
                    </div>
                    <HexDisplay
                      bytes={masterPriv}
                      colorClass="bg-accent-secondary/20 text-[#c4b5fd]"
                    />
                  </div>
                  <div className="rounded-xl border border-accent-primary/40 bg-bg-primary p-5">
                    <div className="mb-3 font-code text-xs font-bold uppercase tracking-wider text-accent-primary">
                      IR — Master Chain Code (32B)
                    </div>
                    <HexDisplay
                      bytes={masterChain}
                      colorClass="bg-accent-primary/15 text-accent-primary"
                    />
                  </div>
                </div>
                <InfoCard color="var(--accent-success)">
                  <strong>Der Chain Code</strong> ist der Zufallsanker — ohne ihn
                  keine Child-Ableitung. Er wird bei jeder Ebene erneuert.
                </InfoCard>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-secondary/25 bg-accent-secondary/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-4xl leading-none">🌳</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 3: Hardened Derivation (3×)
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    Drei aufeinanderfolgende HMAC-SHA512 Ableitungen mit dem
                    Private Key: m/84&apos;/0&apos;/0&apos; — Purpose → Coin → Account. Jede
                    Ebene erzeugt einen neuen Private Key + Chain Code.
                  </div>
                </div>
              </div>
            </div>

            <div data-zpub-animate>
              <Label>DERIVATIONSPFAD</Label>
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-[22px]">
                <span className="text-text-secondary">m</span>
                <span className="text-text-secondary">/</span>
                <span className="font-bold text-accent-secondary">84&apos;</span>
                <span className="text-text-secondary">/</span>
                <span className="font-bold text-accent-warning">0&apos;</span>
                <span className="text-text-secondary">/</span>
                <span className="font-bold text-accent-primary">0&apos;</span>
              </div>
            </div>

            <div data-zpub-animate>
              <Label>3-LEVEL ABSTIEG</Label>
              <div className="flex flex-col gap-1">
                {/* Master */}
                <div className="flex items-center gap-3.5 rounded-xl border border-accent-success/30 bg-bg-primary p-3.5">
                  <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-accent-success/13 font-code text-[11px] text-accent-success">
                    0
                  </div>
                  <div className="w-[120px]">
                    <div className="text-sm font-bold text-accent-success">m</div>
                    <div className="text-xs text-text-secondary">Master</div>
                  </div>
                  <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-code text-[11px] text-text-muted">
                    {masterPriv ? fmtHex(toHex(masterPriv), 14) : "···"}
                  </div>
                </div>

                {derivationLevels.map((level) => (
                  <div key={level.depth}>
                    <div className="ml-3 flex items-center">
                      <div className="h-4 w-px bg-border-active" />
                    </div>
                    <div
                      className="flex items-center gap-3.5 rounded-xl border bg-bg-primary p-3.5"
                      style={{
                        borderColor: `color-mix(in srgb, ${ZPUB_STEPS[2].color} 30%, transparent)`,
                      }}
                    >
                      <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-accent-secondary/13 font-code text-[11px] text-accent-secondary">
                        {level.depth}
                      </div>
                      <div className="w-[120px]">
                        <div className="text-sm font-bold text-accent-secondary">
                          {level.path}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {level.name}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-code text-[11px] text-text-muted">
                        {fmtHex(toHex(level.privKey), 14)}
                      </div>
                      <div className="flex-shrink-0 rounded-[10px] bg-accent-secondary/20 px-2.5 py-1 text-[11px] text-[#c4b5fd]">
                        hardened
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <InfoCard color="var(--accent-secondary)">
                <strong>Warum hardened?</strong> Der Private Key fließt in den
                HMAC ein → Child Private Keys sind nicht aus dem Public Key
                rückrechenbar. Das ist der Sicherheitskern.
              </InfoCard>
            </div>
          </div>
        );

      case 4:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-primary/25 bg-accent-primary/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-4xl leading-none">🔑</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 4: Private → Public Key
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    Elliptische-Kurven-Multiplikation: Account Private Key × G
                    (Generator-Punkt der secp256k1-Kurve). Das Ergebnis ist ein
                    komprimierter Public Key (33 Bytes).
                  </div>
                </div>
              </div>
            </div>

            <div data-zpub-animate>
              <div className="my-4 flex items-center gap-5 rounded-xl border border-border-subtle bg-bg-primary p-5">
                <div className="text-[32px]">✖️</div>
                <div>
                  <div className="font-body text-lg font-bold text-accent-primary">
                    EC-Multiplikation (secp256k1)
                  </div>
                  <div className="text-sm text-text-secondary">
                    Public Key = Private Key × G (Generator-Punkt)
                  </div>
                </div>
              </div>
            </div>

            {derivationLevels.length >= 3 && accountPubKey && (
              <div data-zpub-animate>
                <Label>INPUT — ACCOUNT PRIVATE KEY</Label>
                <HexDisplay
                  bytes={derivationLevels[2].privKey}
                  colorClass="bg-accent-secondary/20 text-[#c4b5fd]"
                />

                <Label>OUTPUT — COMPRESSED PUBLIC KEY (33 BYTES)</Label>
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
                    <div className="mt-0.5 text-xs text-text-secondary">
                      32 Bytes
                    </div>
                  </div>
                </div>

                <InfoCard>
                  <strong>Compressed Public Key:</strong> Nur die x-Koordinate +
                  1 Byte Prefix (02 oder 03 je nach Parität von y). Das spart 32
                  Bytes gegenüber dem unkomprimierten Format.
                </InfoCard>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-[#fb7185]/25 bg-[#fb7185]/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-4xl leading-none">📦</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 5: Serialisierung → zpub
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    78 Bytes werden zusammengesetzt: Version (4B) + Depth (1B) +
                    Parent Fingerprint (4B) + Child Index (4B) + Chain Code (32B) +
                    Public Key (33B). Dann SHA256² Checksum + Base58Check.
                  </div>
                </div>
              </div>
            </div>

            {serialized && (
              <>
                <div data-zpub-animate>
                  <Label>78-BYTE STRUKTUR</Label>
                  <ByteFieldDisplay serialized={serialized} />
                </div>

                <div data-zpub-animate>
                  <Label>BASE58CHECK ENCODING</Label>
                  <div className="rounded-xl border border-[#fb7185]/30 bg-[#fb7185]/5 p-5">
                    <div className="mb-2 font-code text-[10px] tracking-wider text-text-muted">
                      ZPUB (BASE58CHECK)
                    </div>
                    <div className="break-all font-code text-sm font-bold leading-8 text-[#fb7185]">
                      {serialized.encoded}
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      {serialized.encoded.length} Zeichen
                    </div>
                  </div>
                </div>

                <div data-zpub-animate>
                  <VersionComparison serialized={serialized} />
                </div>

                <div data-zpub-animate>
                  <Label>ABGELEITETE ADRESSEN (bc1q)</Label>
                  <div className="space-y-1.5">
                    {addresses.map((addr, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-primary p-3"
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-accent-primary/10 font-code text-[10px] font-bold text-accent-primary">
                          {i}
                        </span>
                        <span className="font-code text-[10px] text-text-muted">
                          m/84&apos;/0&apos;/0&apos;/0/{i}
                        </span>
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-code text-xs text-accent-primary">
                          {addr}
                        </span>
                      </div>
                    ))}
                  </div>
                  <InfoCard color="#fb7185">
                    <strong>zpub ist die &quot;Fabrik&quot; für bc1q-Adressen.</strong> Er
                    enthält keinen Private Key, aber genug Information, um
                    unendlich viele Empfangsadressen deterministisch zu erzeugen —
                    und das vollständig ohne Risiko für deine Coins.
                  </InfoCard>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <StepNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      {computing && (
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-active border-t-accent-secondary" />
          Berechne Derivation...
        </div>
      )}

      {renderStep()}

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            className="flex items-center gap-2 rounded-lg border border-border-active bg-transparent px-4 py-2.5 font-code text-sm text-text-secondary transition-all hover:border-accent-primary hover:text-accent-primary"
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            ← Zurück
          </button>
        ) : (
          <div />
        )}
        {currentStep < 5 && completedSteps >= currentStep && (
          <button
            className="flex items-center gap-2 rounded-lg border border-accent-secondary bg-accent-secondary/15 px-4 py-2.5 font-code text-sm text-white transition-all hover:bg-accent-secondary/30"
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Weiter →
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 rounded-xl border border-border-subtle bg-bg-card p-3 text-center font-code text-[10px] leading-[1.8] text-text-muted">
        NUR FÜR LERNZWECKE — Niemals echte Mnemonics in Browser-Apps eingeben
      </div>
    </div>
  );
}
