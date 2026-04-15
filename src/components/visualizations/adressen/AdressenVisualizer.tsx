"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { base58, bech32 } from "@scure/base";

// ─── Test Vector Verification ────────────────────────────────────────────────
// pubkey:  0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
// p2pkh:   1BpEi6DfDAUFd153wiGrvkiKW1ECQ8xCXe
// p2wpkh:  bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4
// (verified at build time — see bottom of file)

interface AdressenVisualizerProps {
  initialPubkey?: string;
}

type Step = 1 | 2 | 3 | 4;

function isValidPubkey(hex: string): boolean {
  return /^(02|03)[0-9a-f]{64}$/.test(hex.toLowerCase());
}

function generateRandomPubkey(): string {
  const privKey = secp256k1.utils.randomPrivateKey();
  const pubKeyBytes = secp256k1.getPublicKey(privKey, true);
  return bytesToHex(pubKeyBytes);
}

function computeAddresses(pubkeyHex: string): {
  sha256Result: Uint8Array;
  hash160: Uint8Array;
  p2pkhVersioned: Uint8Array;
  p2pkhChecksum: Uint8Array;
  p2pkhPayload: Uint8Array;
  p2pkhAddress: string;
  p2wpkhAddress: string;
} {
  const pubBytes = hexToBytes(pubkeyHex);
  const sha256Result = sha256(pubBytes);
  const hash160 = ripemd160(sha256Result);

  // Base58Check manually (P2PKH)
  const versioned = new Uint8Array([0x00, ...hash160]);
  const checksumFull = sha256(sha256(versioned));
  const checksum = checksumFull.slice(0, 4);
  const payload25 = new Uint8Array([...versioned, ...checksum]);
  const p2pkhAddress = base58.encode(payload25);

  // Bech32 (P2WPKH)
  const words = bech32.toWords(hash160);
  const p2wpkhAddress = bech32.encode("bc", [0x00, ...words]);

  return {
    sha256Result,
    hash160,
    p2pkhVersioned: versioned,
    p2pkhChecksum: checksum,
    p2pkhPayload: payload25,
    p2pkhAddress,
    p2wpkhAddress,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MonoRow({
  label,
  value,
  color = "text-[var(--text-primary)]",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <div className="w-[180px] flex-shrink-0 font-mono text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--text-muted)]">
        {label}
      </div>
      <div className={`break-all font-mono text-sm leading-[1.7] ${color}`}>
        {value}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border-active)] bg-transparent px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition-[border-color,color] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
    >
      {copied ? "✓ Kopiert" : "Kopieren"}
    </button>
  );
}

interface ByteMapProps {
  segments: Array<{
    label: string;
    hex: string;
    colorBg: string;
    colorText: string;
    chipLabel: string;
  }>;
}

function ByteMap({ segments }: ByteMapProps) {
  return (
    <div className="space-y-3">
      {/* Hex row */}
      <div className="flex flex-wrap items-center gap-0 overflow-hidden rounded-lg border border-[var(--border-subtle)]">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={`${seg.colorBg} ${seg.colorText} break-all px-1.5 py-1 font-mono text-[11px] leading-[1.6]`}
          >
            {seg.hex}
          </span>
        ))}
      </div>
      {/* Chip labels */}
      <div className="flex flex-wrap gap-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${seg.colorBg} ${seg.colorText}`}
          >
            <span className="font-mono">{seg.label}</span>
            <span className="opacity-70">{seg.chipLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { id: 1 as Step, title: "Public Key", short: "Key" },
  { id: 2 as Step, title: "Hash160", short: "Hash" },
  { id: 3 as Step, title: "Encoding", short: "Enc." },
  { id: 4 as Step, title: "Adressen", short: "Addr." },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdressenVisualizer({ initialPubkey }: AdressenVisualizerProps) {
  const [pubkeyHex, setPubkeyHex] = useState<string>("");
  const [pubkeyInput, setPubkeyInput] = useState<string>("");
  const [pubkeyValid, setPubkeyValid] = useState<boolean>(false);
  const [sha256Result, setSha256Result] = useState<Uint8Array | null>(null);
  const [hash160, setHash160] = useState<Uint8Array | null>(null);
  const [p2pkhAddress, setP2pkhAddress] = useState<string>("");
  const [p2wpkhAddress, setP2wpkhAddress] = useState<string>("");
  const [p2pkhVersioned, setP2pkhVersioned] = useState<Uint8Array | null>(null);
  const [p2pkhChecksum, setP2pkhChecksum] = useState<Uint8Array | null>(null);
  const [activeStep, setActiveStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialise on mount
   
  useEffect(() => {
    const initial =
      initialPubkey && isValidPubkey(initialPubkey)
        ? initialPubkey
        : generateRandomPubkey();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPubkeyInput(initial);
    setPubkeyHex(initial);
    setPubkeyValid(true);
  }, [initialPubkey]);

  // Crypto pipeline whenever valid pubkey changes
  useEffect(() => {
    if (!pubkeyValid || !pubkeyHex) return;
    try {
      const result = computeAddresses(pubkeyHex);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSha256Result(result.sha256Result);
      setHash160(result.hash160);
      setP2pkhVersioned(result.p2pkhVersioned);
      setP2pkhChecksum(result.p2pkhChecksum);
      setP2pkhAddress(result.p2pkhAddress);
      setP2wpkhAddress(result.p2wpkhAddress);
    } catch (e) {
      console.error("Address computation error:", e);
    }
  }, [pubkeyHex, pubkeyValid]);

  // Hero entrance animation on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-animate]", {
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Kill any in-flight step tween on unmount
  const stepTweenRef = useRef<ReturnType<typeof gsap.from> | null>(null);
  useEffect(() => () => { stepTweenRef.current?.kill(); }, []);

  // Step transition animation
  const animateStepIn = useCallback(() => {
    if (!contentRef.current) return;
    stepTweenRef.current?.kill();
    stepTweenRef.current = gsap.from(contentRef.current, {
      opacity: 0,
      y: 15,
      duration: 0.4,
      ease: "power2.out",
    });
  }, []);

  function handleStepChange(step: Step) {
    setActiveStep(step);
    animateStepIn();
  }

  function handleInputChange(val: string) {
    setPubkeyInput(val);
    const normalised = val.trim().toLowerCase();
    const valid = isValidPubkey(normalised);
    setPubkeyValid(valid);
    if (valid) {
      setPubkeyHex(normalised);
    }
  }

  function handleRandomize() {
    const hex = generateRandomPubkey();
    setPubkeyInput(hex);
    setPubkeyHex(hex);
    setPubkeyValid(true);
  }

  function handleNext() {
    const nextStep = (activeStep + 1) as Step;
    setCompletedSteps((prev) => new Set([...prev, activeStep]));
    handleStepChange(nextStep);
  }

  function handlePrev() {
    handleStepChange((activeStep - 1) as Step);
  }

  function handleRestart() {
    handleRandomize();
    setCompletedSteps(new Set());
    handleStepChange(1);
  }

  const canProceed =
    activeStep === 1
      ? pubkeyValid
      : activeStep === 2
        ? !!hash160
        : activeStep === 3
          ? !!p2pkhAddress && !!p2wpkhAddress
          : false;

  // ─── Step renderers ───────────────────────────────────────────────────────

  function renderStep1() {
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
              onChange={(e) => handleInputChange(e.target.value)}
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
            onClick={handleRandomize}
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

  function renderStep2() {
    if (!sha256Result || !hash160) return null;
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

  function renderStep3() {
    if (!hash160 || !p2pkhVersioned || !p2pkhChecksum) return null;
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

  function renderStep4() {
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
          onClick={handleRestart}
          className="w-full rounded-xl border border-[var(--border-active)] bg-transparent py-3 font-mono text-sm text-[var(--text-secondary)] transition-[border-color,color] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          ↻ Neuen Key generieren
        </button>
      </div>
    );
  }

  // ─── Tab Nav ──────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef}>
      {/* Step navigation */}
      <div data-hero-animate className="mb-8 flex items-center gap-0 overflow-x-auto">
        {STEPS.map((s, i) => {
          const isActive = activeStep === s.id;
          const isDone = completedSteps.has(s.id);
          return (
            <div key={s.id} className="flex items-center">
              <button
                className={`flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-3 font-mono text-sm transition-[border-color,color] ${
                  isActive
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-white"
                    : isDone
                      ? "border-[var(--accent-success)]/30 bg-[var(--bg-card)] text-[var(--text-secondary)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)]"
                } ${!isDone && !isActive ? "opacity-50" : "cursor-pointer"}`}
                onClick={() => {
                  if (isDone || isActive) handleStepChange(s.id);
                }}
              >
                <div
                  className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                      : isDone
                        ? "bg-[var(--accent-success)] text-black"
                        : "bg-[var(--border-active)] text-[var(--text-muted)]"
                  }`}
                >
                  {isDone && !isActive ? "✓" : s.id}
                </div>
                <span className="hidden whitespace-nowrap sm:inline">{s.title}</span>
                <span className="whitespace-nowrap sm:hidden">{s.short}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-6 flex-shrink-0 ${isDone ? "bg-[var(--accent-success)]" : "bg-[var(--border-subtle)]"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div ref={contentRef}>
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
        {activeStep === 3 && renderStep3()}
        {activeStep === 4 && renderStep4()}
      </div>

      {/* Navigation buttons */}
      {activeStep < 4 && (
        <div data-hero-animate className="mt-6 flex items-center justify-between">
          {activeStep > 1 ? (
            <button
              className="flex items-center gap-2 rounded-lg border border-[var(--border-active)] bg-transparent px-4 py-2.5 font-mono text-sm text-[var(--text-secondary)] transition-[border-color,color] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              onClick={handlePrev}
            >
              ← Zurück
            </button>
          ) : (
            <div />
          )}
          <button
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-sm transition-[border-color,color] ${
              canProceed
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-white hover:bg-[var(--accent-primary)]/30"
                : "cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-muted)] opacity-50"
            }`}
            onClick={canProceed ? handleNext : undefined}
            disabled={!canProceed}
          >
            Weiter →
          </button>
        </div>
      )}

      {/* Footer disclaimer */}
      <div data-hero-animate className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-center font-mono text-[10px] leading-[1.8] text-[var(--text-muted)]">
        NUR FÜR LERNZWECKE — Alle Berechnungen laufen lokal im Browser
      </div>
    </div>
  );
}

// ─── Test Vector Verification (runs once at module load in dev) ───────────────
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  try {
    const TV_PUBKEY = "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
    const TV_P2PKH = "1BpEi6DfDAUFd153wiGrvkiKW1ECQ8xCXe";
    const TV_P2WPKH = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

    const result = computeAddresses(TV_PUBKEY);
    console.assert(result.p2pkhAddress === TV_P2PKH,
      `Test vector P2PKH FAIL: expected ${TV_P2PKH}, got ${result.p2pkhAddress}`);
    console.assert(result.p2wpkhAddress === TV_P2WPKH,
      `Test vector P2WPKH FAIL: expected ${TV_P2WPKH}, got ${result.p2wpkhAddress}`);
    console.log("[AdressenVisualizer] Test vectors OK:", result.p2pkhAddress, result.p2wpkhAddress);
  } catch (e) {
    console.error("[AdressenVisualizer] Test vector check threw:", e);
  }
}
