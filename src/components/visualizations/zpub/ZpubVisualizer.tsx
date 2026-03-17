"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { fullZpubDerivation, toHex } from "./crypto-utils";
import { DEFAULT_MNEMONIC } from "./constants";
import type { SerializedKey } from "./types";

import { StepNav } from "./components/StepNav";
import { InfoCard } from "./components/InfoCard";
import { OriginBanner } from "./components/OriginBanner";
import { PublicKeyDerivation } from "./components/PublicKeyDerivation";
import { ByteFieldDisplay } from "./components/ByteFieldDisplay";
import { VersionComparison } from "./components/VersionComparison";
import { ZpubDecoder } from "./components/ZpubDecoder";
import { PublicDerivationFlow } from "./components/PublicDerivationFlow";
import { HardenedComparison } from "./components/HardenedComparison";
import { AddressExplorer } from "./components/AddressExplorer";
import { WatchOnlyWallet } from "./components/WatchOnlyWallet";

export default function ZpubVisualizer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [mnemonic, setMnemonic] = useState(DEFAULT_MNEMONIC);
  const [passphrase, setPassphrase] = useState("");
  const [computing, setComputing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);

  // Derivation results
  const [accountPrivKey, setAccountPrivKey] = useState<Uint8Array | null>(null);
  const [accountPubKey, setAccountPubKey] = useState<Uint8Array | null>(null);
  const [accountChainCode, setAccountChainCode] = useState<Uint8Array | null>(null);
  const [serialized, setSerialized] = useState<SerializedKey | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Run full derivation on mnemonic/passphrase change (background)
  useEffect(() => {
    const words = mnemonic.trim().split(/\s+/).filter(Boolean);
    if (words.length < 12) return;

    setComputing(true);
    fullZpubDerivation(mnemonic, passphrase)
      .then((result) => {
        setAccountPrivKey(result.derivationLevels[2].privKey);
        setAccountPubKey(result.accountPubKey);
        setAccountChainCode(result.accountChainCode);
        setSerialized(result.serialized);
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

  const renderStep = () => {
    switch (currentStep) {
      /* ── Step 1: Private → Public Key ── */
      case 1:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <OriginBanner />
            </div>

            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-primary/25 bg-accent-primary/[0.06] p-6 items-start">
                <div className="flex-shrink-0 font-code text-2xl leading-none text-accent-primary">
                  <span className="text-[#34d399]">P</span>{" "}
                  <span className="text-text-muted">=</span>{" "}
                  <span className="text-[#c4b5fd]">k</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-accent-primary">G</span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 1: Vom Private Key zum Public Key
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    Der Account Private Key (aus m/84&apos;/0&apos;/0&apos;) wird per
                    EC-Multiplikation auf der secp256k1-Kurve zum komprimierten
                    Public Key (33 Bytes).
                  </div>
                </div>
              </div>
            </div>

            <div data-zpub-animate>
              <Label>Mnemonic Eingabe</Label>
              <textarea
                className="w-full resize-y rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm leading-[1.7] text-text-primary outline-none transition-colors focus:border-accent-secondary"
                rows={3}
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="12–24 BIP39 Wörter..."
              />
            </div>

            <div data-zpub-animate>
              <Label>Optionale Passphrase</Label>
              <input
                className="w-full rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-sm text-text-primary outline-none transition-colors focus:border-accent-secondary"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder='leer = Salt ist nur "mnemonic"'
              />
            </div>

            {accountPrivKey && accountPubKey && (
              <div data-zpub-animate>
                <PublicKeyDerivation
                  accountPrivKey={accountPrivKey}
                  accountPubKey={accountPubKey}
                />
              </div>
            )}
          </div>
        );

      /* ── Step 2: Anatomie eines zpub ── */
      case 2:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-[#fb7185]/25 bg-[#fb7185]/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-3xl leading-none font-code text-[#fb7185]">78B</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 2: Anatomie eines zpub
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    78 Bytes werden zusammengesetzt: Version (4B) + Depth (1B) +
                    Parent Fingerprint (4B) + Child Index (4B) + Chain Code (32B) +
                    Public Key (33B). Dann SHA256² Checksum + Base58Check.
                  </div>
                </div>
              </div>
            </div>

            {/* Mode tabs: Generated vs Decode */}
            {serialized && (
              <>
                <div data-zpub-animate>
                  <Label>78-Byte Struktur (generiert)</Label>
                  <ByteFieldDisplay serialized={serialized} />
                </div>

                <div data-zpub-animate>
                  <Label>Derivation Path</Label>
                  <div className="rounded-xl border border-accent-secondary/25 bg-accent-secondary/[0.06] p-5">
                    <pre className="font-code text-sm leading-[2] text-text-primary">
{`m / 84' / 0' / 0'
│    │     │    └─ Account #0 (hardened)
│    │     └────── Coin: Bitcoin mainnet (hardened)
│    └──────────── Purpose: BIP-84 / Native SegWit (hardened)
└───────────────── Master Key (from seed)`}
                    </pre>
                    <div className="mt-3 space-y-1.5 text-[13px] leading-[1.7] text-text-secondary">
                      <p>
                        <strong className="text-accent-secondary">&apos;</strong> = Hardened
                        Derivation — erfordert den Private Key und verhindert, dass
                        ein kompromittierter Child Key den Parent Key verraten kann.
                      </p>
                      <p>
                        Der zpub sitzt auf <strong className="text-white">Depth 3</strong> — alles
                        darunter (Chain, Index) wird <strong className="text-[#34d399]">non-hardened</strong> abgeleitet,
                        also nur mit dem Public Key + Chain Code.
                      </p>
                    </div>
                  </div>
                </div>

                <div data-zpub-animate>
                  <Label>Base58Check Encoding</Label>
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
                  <VersionComparison />
                </div>
              </>
            )}

            <div data-zpub-animate>
              <Label>Eigenen zpub decodieren</Label>
              <ZpubDecoder onDecoded={() => {}} />
            </div>

            <div data-zpub-animate>
              <InfoCard color="#fb7185">
                <strong>Base58Check</strong> stellt sicher, dass Tippfehler
                erkannt werden: Die 4-Byte Checksum am Ende ist ein
                doppelter SHA256-Hash der 78 Rohdaten. Jeder Extended Key
                (xpub, ypub, zpub) hat die exakt gleiche Struktur — nur die
                Version Bytes unterscheiden sich.
              </InfoCard>
            </div>
          </div>
        );

      /* ── Step 3: Non-Hardened Derivation ── */
      case 3:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-secondary/25 bg-accent-secondary/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-3xl leading-none font-code text-accent-secondary">f()</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 3: Non-Hardened Derivation
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    Das Kernkonzept hinter Watch-Only Wallets: Child Public Keys
                    aus dem Parent Public Key + Chain Code ableiten — ganz{" "}
                    <strong className="text-white">ohne den Private Key</strong>.
                  </div>
                </div>
              </div>
            </div>

            {accountPubKey && accountChainCode && (
              <>
                <div data-zpub-animate>
                  <div className="mb-5 rounded-xl border border-border-active bg-bg-card p-5">
                    <div className="mb-3 font-code text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
                      Aus dem zpub (Schritt 2) extrahiert
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-[#34d399]/10 p-3">
                        <div className="w-[120px] flex-shrink-0 font-code text-xs font-bold text-[#34d399]">
                          Public Key (33B)
                        </div>
                        <div className="flex-1 font-code text-xs text-[#34d399]">
                          → parentPub
                        </div>
                        <div className="break-all font-code text-[10px] text-[#34d399]/70">
                          0x{toHex(accountPubKey).slice(0, 16)}...
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-accent-primary/10 p-3">
                        <div className="w-[120px] flex-shrink-0 font-code text-xs font-bold text-accent-primary">
                          Chain Code (32B)
                        </div>
                        <div className="flex-1 font-code text-xs text-accent-primary">
                          → HMAC key
                        </div>
                        <div className="break-all font-code text-[10px] text-accent-primary/70">
                          0x{toHex(accountChainCode).slice(0, 16)}...
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs leading-[1.7] text-text-muted">
                      Der zpub kodiert diese 65 Bytes zusammen mit Metadaten — für die
                      Ableitung zählen nur Public Key und Chain Code.
                    </div>
                  </div>
                </div>

                <div data-zpub-animate>
                  <PublicDerivationFlow
                    accountPubKey={accountPubKey}
                    accountChainCode={accountChainCode}
                  />
                </div>
              </>
            )}

            <div data-zpub-animate>
              <HardenedComparison />
            </div>
          </div>
        );

      /* ── Step 4: Adress-Ableitung ── */
      case 4:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-success/25 bg-accent-success/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-3xl leading-none font-code text-accent-success">bc1</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 4: Adress-Ableitung
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    Vom zpub zur bc1q-Adresse: Zwei non-hardened Ableitungen
                    (Chain → Index), dann HASH160 + Bech32 Encoding. Empfangs-
                    und Wechseladressen verwenden unterschiedliche Chain-Indizes.
                  </div>
                </div>
              </div>
            </div>

            <div data-zpub-animate>
              <div className="mb-5 rounded-xl border border-accent-success/20 bg-accent-success/[0.04] p-5">
                <div className="mb-2 font-code text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
                  Vollständiger Ableitungspfad
                </div>
                <pre className="font-code text-sm leading-[2] text-text-primary">
{`m/84'/0'/0'  ← zpub (Schritt 2)
     └─ /0   ← Chain (Empfang)       ← 1. Ableitung
         └─ /i   ← Adress-Index      ← 2. Ableitung`}
                </pre>
                <div className="mt-2 text-xs text-text-muted">
                  Beide Ableitungen sind non-hardened — sie brauchen nur den Public Key + Chain Code aus dem zpub.
                </div>
              </div>
            </div>

            {accountPubKey && accountChainCode && (
              <div data-zpub-animate>
                <AddressExplorer
                  accountPubKey={accountPubKey}
                  accountChainCode={accountChainCode}
                />
              </div>
            )}

            <div data-zpub-animate>
              <InfoCard color="var(--accent-success)">
                <strong>Zwei Chains:</strong> Empfangsadressen (Chain 0) sind für
                eingehende Zahlungen. Wechseladressen (Chain 1) empfangen das
                Restgeld einer Transaktion — sie werden nie nach außen kommuniziert
                und erhöhen die Privacy.
              </InfoCard>
            </div>
          </div>
        );

      /* ── Step 5: Watch-Only Wallet ── */
      case 5:
        return (
          <div ref={containerRef}>
            <div data-zpub-animate>
              <div className="mb-6 flex gap-5 rounded-[14px] border border-accent-warning/25 bg-accent-warning/[0.06] p-6 items-start">
                <div className="flex-shrink-0 text-3xl leading-none font-code text-accent-warning">👁</div>
                <div className="flex-1">
                  <div className="mb-2 font-body text-xl font-extrabold text-white">
                    Schritt 5: Watch-Only Wallet
                  </div>
                  <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
                    Ein zpub ermöglicht volle Transparenz ohne Risiko: Adressen
                    generieren, Balances prüfen, Zahlungen verifizieren — aber{" "}
                    <strong className="text-white">niemals</strong> Funds ausgeben.
                  </div>
                </div>
              </div>
            </div>

            <div data-zpub-animate>
              <WatchOnlyWallet />
            </div>
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
