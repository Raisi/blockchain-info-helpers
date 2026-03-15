"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap";
import {
  generatePrivateKey,
  getPublicKey,
  bytesToHex,
  SECP256K1_PARAMS,
} from "../crypto-utils";

export default function KeyGeneration() {
  const [privateKeyHex, setPrivateKeyHex] = useState("");
  const [publicKeyHex, setPublicKeyHex] = useState("");
  const [publicKeyX, setPublicKeyX] = useState("");
  const [publicKeyY, setPublicKeyY] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showParams, setShowParams] = useState(false);

  const privRef = useRef<HTMLDivElement>(null);
  const pubRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(() => {
    setIsGenerating(true);

    // Small delay for visual effect
    setTimeout(() => {
      const privKey = generatePrivateKey();
      const pubKey = getPublicKey(privKey);

      setPrivateKeyHex(bytesToHex(privKey));
      setPublicKeyHex(bytesToHex(pubKey.compressed));
      setPublicKeyX(pubKey.x);
      setPublicKeyY(pubKey.y);
      setIsGenerating(false);

      // Animate the panels
      const ctx = gsap.context(() => {
        if (privRef.current) {
          gsap.from(privRef.current, {
            opacity: 0,
            x: -20,
            duration: 0.5,
            ease: "power3.out",
          });
        }
        if (arrowRef.current) {
          gsap.from(arrowRef.current, {
            opacity: 0,
            scale: 0.5,
            duration: 0.4,
            delay: 0.2,
            ease: "back.out(1.7)",
          });
        }
        if (pubRef.current) {
          gsap.from(pubRef.current, {
            opacity: 0,
            x: 20,
            duration: 0.5,
            delay: 0.4,
            ease: "power3.out",
          });
        }
      });

      return () => ctx.revert();
    }, 100);
  }, []);

  // Hex cascade animation for private key display
  const [displayHex, setDisplayHex] = useState("");
  useEffect(() => {
    if (!privateKeyHex) return;
    let frame = 0;
    const total = privateKeyHex.length;
    const interval = setInterval(() => {
      frame++;
      if (frame >= total) {
        setDisplayHex(privateKeyHex);
        clearInterval(interval);
        return;
      }
      // Reveal characters one by one, scramble the rest
      const revealed = privateKeyHex.slice(0, frame);
      const scrambled = Array.from({ length: total - frame }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)]
      ).join("");
      setDisplayHex(revealed + scrambled);
    }, 15);
    return () => clearInterval(interval);
  }, [privateKeyHex]);

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="flex justify-center">
        <button
          onClick={generate}
          disabled={isGenerating}
          className="rounded-xl bg-accent-primary/15 px-6 py-3 font-display text-sm font-semibold text-accent-primary transition-all hover:bg-accent-primary/25 hover:shadow-[var(--glow-primary)] disabled:opacity-50"
        >
          {isGenerating ? "Generiere…" : "🎲 Schlüssel generieren"}
        </button>
      </div>

      {/* Key display: 3-panel layout */}
      {privateKeyHex && (
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* Private Key */}
          <div
            ref={privRef}
            className="rounded-lg border border-border-subtle bg-bg-card p-4"
          >
            <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-warning">
              Private Key (256 Bit)
            </p>
            <p className="break-all font-mono text-xs leading-relaxed text-text-primary">
              {displayHex}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Zufällige Zahl zwischen 1 und n-1
            </p>
          </div>

          {/* Arrow */}
          <div
            ref={arrowRef}
            className="flex items-center justify-center"
          >
            <div className="rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-center">
              <p className="font-display text-lg text-accent-primary">×G</p>
              <p className="text-[10px] text-text-muted">k × Generator</p>
            </div>
          </div>

          {/* Public Key */}
          <div
            ref={pubRef}
            className="rounded-lg border border-border-subtle bg-bg-card p-4"
          >
            <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-success">
              Public Key (komprimiert)
            </p>
            <p className="break-all font-mono text-xs leading-relaxed text-text-primary">
              {publicKeyHex}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-text-muted">
                <span className="text-text-secondary">x:</span>{" "}
                <span className="font-mono">{publicKeyX.slice(0, 16)}…</span>
              </p>
              <p className="text-xs text-text-muted">
                <span className="text-text-secondary">y:</span>{" "}
                <span className="font-mono">{publicKeyY.slice(0, 16)}…</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-4 text-sm text-text-secondary">
        <p className="mb-2 font-display text-xs font-medium uppercase tracking-wider text-accent-primary">
          Von Public Key zur Bitcoin-Adresse
        </p>
        <p>
          Der Public Key wird gehasht:{" "}
          <span className="font-mono text-text-primary">
            RIPEMD160(SHA256(pubkey))
          </span>{" "}
          → 20 Bytes. Diese werden mit Bech32 oder Base58Check kodiert und
          ergeben die Bitcoin-Adresse (z.B. bc1q…).
        </p>
      </div>

      {/* secp256k1 parameters toggle */}
      <div>
        <button
          onClick={() => setShowParams((p) => !p)}
          className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <span
            className={`inline-block transition-transform ${showParams ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          secp256k1 Parameter anzeigen
        </button>

        {showParams && (
          <div className="mt-3 rounded-lg border border-border-subtle bg-bg-card p-4">
            <div className="space-y-2 font-mono text-xs">
              <div>
                <span className="text-text-muted">p = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.p}
                </span>
              </div>
              <div>
                <span className="text-text-muted">n = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.n}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Gx = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.Gx}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Gy = </span>
                <span className="break-all text-text-secondary">
                  {SECP256K1_PARAMS.Gy}
                </span>
              </div>
              <div>
                <span className="text-text-muted">a = </span>
                <span className="text-text-secondary">
                  {SECP256K1_PARAMS.a}
                </span>
                <span className="text-text-muted ml-4">b = </span>
                <span className="text-text-secondary">
                  {SECP256K1_PARAMS.b}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-muted">
              p ist die Primzahl des endlichen Körpers, n die Ordnung der Kurve,
              G der Generator-Punkt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
