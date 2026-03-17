"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import type {
  MasterKey,
  Bip44Config,
} from "./types";
import {
  toHex,
  fmtHex,
  splitHex,
  mnemonicToSeed,
  seedToMaster,
  childDerive,
} from "./crypto";
import {
  DEFAULT_MNEMONIC,
  COIN_TYPES,
  STEPS,
  STEP_COLORS,
  FLOW_NODES,
  STEP_TO_FLOW,
} from "./constants";

/* ── Shared Sub-Components ── */

function ExplainBox({
  icon,
  title,
  text,
  color = "var(--accent-secondary)",
  steps = [],
}: {
  icon: string;
  title: string;
  text: string;
  color?: string;
  steps?: string[];
}) {
  return (
    <div
      className="mb-8 flex gap-5 rounded-[14px] border p-6 items-start"
      style={{
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
        background: `color-mix(in srgb, ${color} 6%, transparent)`,
      }}
    >
      <div className="flex-shrink-0 text-4xl leading-none">{icon}</div>
      <div className="flex-1">
        <div className="mb-2 font-body text-xl font-extrabold text-white">
          {title}
        </div>
        <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
          {text}
        </div>
        {steps.length > 0 && (
          <div className="mt-3.5 flex flex-col gap-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex gap-3 items-start rounded-lg border border-white/5 bg-black/30 p-2.5"
              >
                <div
                  className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: color }}
                >
                  {i + 1}
                </div>
                <div
                  className="font-body text-sm leading-relaxed text-text-secondary [&_strong]:text-text-primary [&_code]:font-code [&_em]:text-accent-primary"
                  dangerouslySetInnerHTML={{ __html: s }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowBar({
  step,
  seed,
  masterKey,
}: {
  step: number;
  seed: Uint8Array | null;
  masterKey: MasterKey | null;
}) {
  const activeNode = STEP_TO_FLOW[step] ?? 0;
  const computedUpTo = seed ? (masterKey ? 8 : 3) : -1;
  return (
    <div className="mb-7 flex items-center gap-0 overflow-x-auto rounded-xl border border-border-subtle bg-bg-primary p-4">
      {FLOW_NODES.map((n, i) => {
        const isActive = i === activeNode;
        const isDone = i < activeNode && i <= computedUpTo;
        return (
          <Fragment key={i}>
            <div className="flex flex-shrink-0 flex-col items-center gap-1 rounded-lg p-1 transition-colors hover:bg-white/[0.04]">
              <div
                className="grid h-9 w-9 place-items-center rounded-full border-2 text-base transition-all"
                style={{
                  color: isActive
                    ? n.color
                    : isDone
                      ? "var(--accent-success)"
                      : "var(--text-muted)",
                  background: isActive
                    ? `color-mix(in srgb, ${n.color} 10%, transparent)`
                    : isDone
                      ? "rgba(16,185,129,0.08)"
                      : "transparent",
                  borderColor: isActive
                    ? n.color
                    : isDone
                      ? "var(--accent-success)"
                      : "var(--border-active)",
                  boxShadow: isActive
                    ? `0 0 12px ${n.color}`
                    : "none",
                }}
              >
                {isDone ? "✓" : n.icon}
              </div>
              <div
                className={`whitespace-nowrap font-code text-[9px] tracking-wider ${isActive ? "text-text-primary" : "text-text-muted"}`}
              >
                {n.label}
              </div>
            </div>
            {i < FLOW_NODES.length - 1 && (
              <div
                className={`h-0.5 min-w-4 max-w-10 flex-1 flex-shrink-0 ${isDone ? "bg-accent-success" : "bg-border-subtle"}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function HexBlock({
  bytes,
  colorClass = "bg-accent-success/12 text-[#6ee7b7]",
  label = "",
}: {
  bytes: Uint8Array | null;
  colorClass?: string;
  label?: string;
}) {
  if (!bytes) return null;
  return (
    <div>
      {label && (
        <div className="mb-3 mt-7 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted first:mt-0">
          {label}
        </div>
      )}
      <div className="break-all rounded-xl border border-border-subtle bg-bg-primary p-5 font-code text-[15px] leading-[2.2]">
        {splitHex(toHex(bytes), 8).map((c, i) => (
          <span
            key={i}
            className={`mr-1.5 mb-1 inline-block cursor-default rounded px-2 py-1 text-[15px] transition-all hover:brightness-[1.4] ${colorClass}`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function AlgoBox({
  icon,
  name,
  detail,
  color = "var(--accent-secondary)",
}: {
  icon: string;
  name: string;
  detail: string;
  color?: string;
}) {
  return (
    <div className="relative my-4 flex items-center gap-5 overflow-hidden rounded-xl border border-border-subtle bg-bg-primary p-5">
      <div className="absolute inset-0 animate-[shimmer_2s_linear_infinite] bg-gradient-to-r from-transparent via-accent-secondary/[0.04] to-transparent" />
      <div className="relative flex-shrink-0 text-[32px]">{icon}</div>
      <div className="relative">
        <div className="font-body text-lg font-bold" style={{ color }}>
          {name}
        </div>
        <div className="mt-1 text-sm leading-[1.7] text-text-secondary">
          {detail}
        </div>
      </div>
      <div className="relative ml-auto text-2xl text-text-muted">→</div>
    </div>
  );
}

function HashAnim({ n = 16 }: { n?: number }) {
  return (
    <div className="relative my-3 flex h-[70px] items-center justify-center gap-[5px] overflow-hidden rounded-lg border border-border-subtle bg-bg-primary px-3.5">
      <div className="absolute left-3 text-[10px] text-text-muted">INPUT</div>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="h-[5px] w-[5px] rounded-full animate-[hashFloat_0.8s_ease-in-out_infinite]"
          style={{
            background:
              i % 3 === 0
                ? "var(--accent-secondary)"
                : i % 3 === 1
                  ? "var(--accent-primary)"
                  : "var(--accent-success)",
            animationDelay: `${i * 0.07}s`,
            animationDuration: `${0.8 + i * 0.05}s`,
          }}
        />
      ))}
      <div className="absolute right-3 text-[10px] text-text-muted">OUTPUT</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-active border-t-accent-secondary" />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-7 font-code text-[13px] font-bold uppercase tracking-[2px] text-text-muted first:mt-0">
      {children}
    </div>
  );
}

function InfoCard({
  children,
  variant = "cyan",
}: {
  children: React.ReactNode;
  variant?: "cyan" | "rose";
}) {
  return (
    <div
      className={`mt-4 rounded-xl border p-4 font-body text-sm leading-[1.8] text-text-secondary [&_strong]:text-accent-primary ${
        variant === "rose"
          ? "border-[#fb7185]/25 bg-[#fb7185]/5 [&_strong]:text-[#fb7185]"
          : "border-accent-primary/20 bg-accent-primary/5"
      }`}
    >
      {children}
    </div>
  );
}

/* ── Step 0: Overview ── */
function OverviewStep({ onGo }: { onGo: (step: number) => void }) {
  const stages = [
    {
      icon: "🎲",
      name: "Entropie → Mnemonic",
      sub: "128–256 Bits → 12–24 BIP39 Wörter",
      algo: "SHA-256 + BIP39 Wordlist",
      step: 1,
      color: "var(--accent-warning)",
    },
    {
      icon: "🔑",
      name: "Mnemonic → Seed",
      sub: "Wörter + Passphrase → 512-Bit Seed",
      algo: "PBKDF2-HMAC-SHA512, 2048 Iterationen",
      step: 2,
      color: "var(--accent-success)",
    },
    {
      icon: "🌱",
      name: "Seed → Master Key",
      sub: "Seed → Master Private Key + Chain Code",
      algo: "HMAC-SHA512('Bitcoin seed')",
      step: 3,
      color: "var(--accent-primary)",
    },
    {
      icon: "🌳",
      name: "Child Key Derivation",
      sub: "Hierarchische Child Key Derivation (BIP32)",
      algo: "HMAC-SHA512 + EC-Addition",
      step: 4,
      color: "var(--accent-secondary)",
    },
    {
      icon: "📍",
      name: "BIP44 HD-Wallet Pfad",
      sub: "Standard: m/44'/coin'/account'/change/index",
      algo: "m / purpose' / coin' / account' / …",
      step: 5,
      color: "var(--accent-danger)",
    },
    {
      icon: "🔮",
      name: "BIP85 Child Entropy",
      sub: "Unabhängige Child Seeds aus Master — vollständig rekursiv!",
      algo: "BIP32 + HMAC-SHA512('bip-entropy-from-k')",
      step: 6,
      color: "#fb7185",
    },
  ];
  return (
    <div>
      <ExplainBox
        icon="🗺️"
        title="Wie hängt alles zusammen?"
        text="Du siehst hier die vollständige Kette vom zufälligen Mnemonic bis zum fertigen Wallet-Schlüssel. Klicke auf einen Schritt um die Details zu sehen."
        color="var(--accent-primary)"
      />
      <Label>KOMPLETTE DERIVATIONSPIPELINE — KLICKE AUF EINEN SCHRITT</Label>
      <div className="flex flex-col">
        {stages.map((s, i) => (
          <div
            key={i}
            className="flex cursor-pointer gap-4 items-stretch"
            onClick={() => onGo(s.step)}
          >
            <div className="flex w-8 flex-shrink-0 flex-col items-center">
              <div
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border-2 text-sm"
                style={{
                  background: `color-mix(in srgb, ${s.color} 13%, transparent)`,
                  borderColor: s.color,
                }}
              >
                {s.icon}
              </div>
              {i < stages.length - 1 && (
                <div className="relative w-0.5 flex-1 overflow-hidden bg-gradient-to-b from-border-active to-border-subtle">
                  <div className="absolute top-[-100%] h-[30%] w-full animate-[flow_2s_linear_infinite] bg-gradient-to-b from-transparent via-accent-primary to-transparent" />
                </div>
              )}
            </div>
            <div
              className="mb-4 flex-1 rounded-xl border border-border-subtle bg-bg-card-hover p-4 transition-colors hover:border-border-active"
            >
              <div
                className="mb-1.5 font-body text-[17px] font-bold"
                style={{ color: s.color }}
              >
                {s.name}
              </div>
              <div className="text-sm text-text-secondary">{s.sub}</div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-[20px] border border-border-subtle bg-bg-primary px-3 py-1 text-xs text-text-muted">
                <span>⚙️</span>
                {s.algo}
              </div>
            </div>
          </div>
        ))}
      </div>
      <InfoCard>
        <strong>Neu — BIP85 + Rekursion:</strong> Aus einem einzigen Master-Seed
        lassen sich beliebig viele vollständig unabhängige Child Seeds ableiten.
        Ein kompromittierter Child Seed enthüllt <strong>nichts</strong> über den
        Master.
      </InfoCard>
    </div>
  );
}

/* ── Step 1: BIP39 ── */
function Bip39Step({
  mnemonic,
  setMnemonic,
}: {
  mnemonic: string;
  setMnemonic: (m: string) => void;
}) {
  const words = mnemonic
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wc = words.length;
  const eb =
    wc === 12
      ? 128
      : wc === 15
        ? 160
        : wc === 18
          ? 192
          : wc === 21
            ? 224
            : wc === 24
              ? 256
              : "?";
  return (
    <div>
      <ExplainBox
        icon="🎲"
        title="Was ist BIP39?"
        text="BIP39 wandelt zufällige Bits in merkbare Wörter um — dein Backup deiner ganzen Wallet."
        color="var(--accent-warning)"
        steps={[
          `<strong>Zufallszahl erzeugen:</strong> Dein Gerät erzeugt ${eb} zufällige Bits.`,
          `<strong>Prüfsumme anhängen:</strong> SHA-256 der Entropie. Die ersten ${typeof eb === "number" ? eb / 32 : "?"} Bits als Prüfsumme.`,
          `<strong>In Wörter übersetzen:</strong> ${wc} Gruppen à 11 Bits → BIP39 Wortliste.`,
        ]}
      />
      <Label>
        DEINE MNEMONIC ({wc} Wörter · {eb} Bit Entropie)
      </Label>
      <textarea
        className="w-full resize-y rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-base leading-[1.7] text-text-primary outline-none transition-colors focus:border-accent-secondary"
        rows={3}
        value={mnemonic}
        onChange={(e) => setMnemonic(e.target.value)}
        placeholder="12–24 BIP39 Wörter eingeben..."
      />
      <div className="mt-4 grid grid-cols-6 gap-2.5 max-sm:grid-cols-3">
        {words.slice(0, 24).map((w, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-primary p-3 text-[15px] transition-colors hover:border-border-active"
          >
            <span className="min-w-[22px] font-code text-xs text-text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-bold text-accent-warning">{w}</span>
          </div>
        ))}
      </div>
      <InfoCard>
        <strong>Sicherheit:</strong>{" "}
        {wc === 12
          ? "12 Wörter = 2¹²⁸ Kombinationen"
          : wc === 24
            ? "24 Wörter = 2²⁵⁶ Kombinationen"
            : `${wc} Wörter`}
        . Brute-Force ist unmöglich.
      </InfoCard>
    </div>
  );
}

/* ── Step 2: PBKDF2 ── */
function Pbkdf2Step({
  mnemonic,
  passphrase,
  setPassphrase,
  seed,
  loading,
}: {
  mnemonic: string;
  passphrase: string;
  setPassphrase: (p: string) => void;
  seed: Uint8Array | null;
  loading: boolean;
}) {
  return (
    <div>
      <ExplainBox
        icon="🔑"
        title="Was macht PBKDF2 hier?"
        text="Deine Mnemonic-Wörter werden durch eine Schlüsselableitungsfunktion gejagt — das Ergebnis ist der 512-Bit Seed."
        color="var(--accent-success)"
        steps={[
          '<strong>Eingabe (Password):</strong> Deine Mnemonic-Phrase als UTF-8 Text.',
          '<strong>Salt = "mnemonic" + Passphrase:</strong> Leer gelassen ist es einfach "mnemonic". Mit Passphrase entsteht eine andere Wallet.',
          "<strong>2048 Iterationen HMAC-SHA512:</strong> Verlangsamt Brute-Force drastisch.",
          "<strong>Output: 512-Bit Seed (64 Bytes):</strong> Die Wurzel deines HD-Wallets.",
        ]}
      />
      <Label>DEINE EINGABEN</Label>
      <div className="grid gap-3.5">
        <div>
          <div className="mb-1.5 text-[13px] text-text-muted">
            PASSWORD — Mnemonic Phrase
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-primary p-5">
            <span className="text-accent-warning">
              {mnemonic.slice(0, 80)}
              {mnemonic.length > 80 ? "···" : ""}
            </span>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[13px] text-text-muted">
            SALT = <em className="text-accent-primary">{'"'}mnemonic{'"'}</em> +
            optionale Passphrase
          </div>
          <input
            className="w-full rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-base text-text-primary outline-none transition-colors focus:border-accent-secondary"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder='leer lassen = Salt ist nur "mnemonic"'
          />
        </div>
      </div>
      <Label>DERIVATION</Label>
      <AlgoBox
        icon="🔁"
        name="PBKDF2-HMAC-SHA512"
        detail="2048 Iterationen · Output: 512 Bit"
        color="var(--accent-success)"
      />
      <HashAnim />
      <Label>SEED OUTPUT (512 BIT = 64 BYTES)</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Spinner />
          Berechne PBKDF2…
        </div>
      ) : seed ? (
        <HexBlock bytes={seed} />
      ) : null}
      <InfoCard>
        <strong>Warum 2048 Iterationen?</strong> Brute-Force wird um Faktor 2048
        verlangsamt.
      </InfoCard>
    </div>
  );
}

/* ── Step 3: Master Key ── */
function MasterKeyStep({
  seed,
  masterKey,
  loading,
}: {
  seed: Uint8Array | null;
  masterKey: MasterKey | null;
  loading: boolean;
}) {
  return (
    <div>
      <ExplainBox
        icon="🌱"
        title="Was ist der Master Key?"
        text="Der Seed wird in zwei Hälften aufgespalten — der linke Teil wird dein Master Private Key, der rechte der Chain Code."
        color="var(--accent-primary)"
        steps={[
          "<strong>Input:</strong> Dein 512-Bit Seed (64 Bytes).",
          '<strong>HMAC-SHA512 mit festem Key:</strong> "Bitcoin seed" (BIP32 Standard).',
          "<strong>Output IL (linke 32 Bytes):</strong> Master Private Key.",
          "<strong>Output IR (rechte 32 Bytes):</strong> Master Chain Code.",
        ]}
      />
      <Label>INPUT — SEED (512 BIT)</Label>
      {seed && (
        <div className="rounded-xl border border-border-subtle bg-bg-primary p-5">
          <span className="mr-1.5 inline-block rounded bg-accent-success/12 px-2 py-1 font-code text-[15px] text-[#6ee7b7]">
            {fmtHex(toHex(seed), 40)}
          </span>
        </div>
      )}
      <Label>HMAC-SHA512 OPERATION</Label>
      <AlgoBox
        icon="🔐"
        name="HMAC-SHA512"
        detail='Key = "Bitcoin seed" · Data = Seed (64 Bytes) → Output: 64 Bytes'
        color="var(--accent-primary)"
      />
      <HashAnim n={20} />
      <Label>OUTPUT — IL (Master Private Key) ∥ IR (Chain Code)</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Spinner />
          Berechne…
        </div>
      ) : masterKey ? (
        <div className="mt-4 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="rounded-xl border border-accent-secondary/40 bg-bg-primary p-5">
            <div className="mb-3 font-code text-[13px] font-bold uppercase tracking-wider text-accent-secondary">
              IL — Master Private Key (32 Bytes)
            </div>
            <div className="break-all leading-8">
              {splitHex(toHex(masterKey.priv), 8).map((c, i) => (
                <span
                  key={i}
                  className="mr-1.5 mb-1 inline-block rounded bg-accent-secondary/20 px-2 py-1 font-code text-[15px] text-[#c4b5fd]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-accent-primary/40 bg-bg-primary p-5">
            <div className="mb-3 font-code text-[13px] font-bold uppercase tracking-wider text-accent-primary">
              IR — Master Chain Code (32 Bytes)
            </div>
            <div className="break-all leading-8">
              {splitHex(toHex(masterKey.chain), 8).map((c, i) => (
                <span
                  key={i}
                  className="mr-1.5 mb-1 inline-block rounded bg-accent-primary/15 px-2 py-1 font-code text-[15px] text-accent-primary"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <InfoCard>
        <strong>&quot;Bitcoin seed&quot;</strong> ist im BIP32-Standard fest kodiert. Jede
        konforme Wallet berechnet denselben Master Key.
      </InfoCard>
    </div>
  );
}

/* ── Step 4: Child Keys ── */
function ChildKeyStep({
  masterKey,
  childKeys,
  loading,
}: {
  masterKey: MasterKey | null;
  childKeys: MasterKey[];
  loading: boolean;
}) {
  const levels = [
    { label: "m", name: "Master", color: "var(--accent-success)", hard: false },
    {
      label: "m/44'",
      name: "Purpose (BIP44)",
      color: "var(--accent-secondary)",
      hard: true,
    },
    {
      label: "m/44'/0'",
      name: "Coin (Bitcoin)",
      color: "var(--accent-warning)",
      hard: true,
    },
    {
      label: "m/44'/0'/0'",
      name: "Account #0",
      color: "var(--accent-primary)",
      hard: true,
    },
    {
      label: "m/44'/0'/0'/0",
      name: "External Chain",
      color: "var(--accent-danger)",
      hard: false,
    },
    {
      label: "m/44'/0'/0'/0/0",
      name: "Adresse #0",
      color: "var(--accent-success)",
      hard: false,
    },
  ];
  const allKeys = masterKey ? [masterKey, ...childKeys] : [];
  return (
    <div>
      <ExplainBox
        icon="🌳"
        title="Was sind Child Keys?"
        text="BIP32 erlaubt es, aus einem Master Key beliebig viele Child Keys abzuleiten — in einer Baumstruktur."
        color="var(--accent-secondary)"
        steps={[
          "<strong>Hardened Ableitung ('):</strong> Input ist der private Key + Chain Code + Index.",
          "<strong>Normal Ableitung:</strong> Input ist der öffentliche Key.",
          "<strong>HMAC-SHA512 + EC-Addition:</strong> IL wird zum Parent Private Key addiert.",
          "<strong>Chain Code (IR):</strong> Rechte Hälfte = neuer Chain Code für nächste Ebene.",
        ]}
      />
      <Label>ABLEITUNGSBAUM — BIP44 PFAD</Label>
      <AlgoBox
        icon="🔀"
        name="Child Key Derivation (CKD)"
        detail="Hardened: HMAC(chain, 0x00 ∥ priv ∥ idx) · Normal: HMAC(chain, pub ∥ idx)"
        color="var(--accent-secondary)"
      />
      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <Spinner />
          Ableitung läuft…
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {levels.map((lv, i) => {
            const kd = allKeys[i];
            const ph = kd ? toHex(kd.priv) : null;
            return (
              <div key={i} className="flex items-stretch gap-0">
                {i > 0 && (
                  <div className="mr-2 flex w-5 flex-col items-center">
                    <div className="w-px flex-1 bg-border-active" />
                  </div>
                )}
                <div
                  className="flex flex-1 items-center gap-3.5 rounded-xl border bg-bg-primary p-3.5 text-sm transition-colors hover:border-border-active"
                  style={{
                    borderColor: `color-mix(in srgb, ${lv.color} 33%, transparent)`,
                  }}
                >
                  <div
                    className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md font-code text-[11px]"
                    style={{
                      background: `color-mix(in srgb, ${lv.color} 13%, transparent)`,
                      color: lv.color,
                    }}
                  >
                    {i}
                  </div>
                  <div className="w-[200px] flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color: lv.color }}>
                      {lv.label}
                    </div>
                    <div className="mt-0.5 text-xs text-text-secondary">
                      {lv.name}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-code text-[13px] text-text-muted">
                    {ph ? fmtHex(ph, 14) : "···"}
                  </div>
                  {lv.hard && (
                    <div className="flex-shrink-0 rounded-[10px] bg-accent-secondary/20 px-2.5 py-1 text-[11px] text-[#c4b5fd]">
                      hardened
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <InfoCard>
        <strong>Hardened vs Normal:</strong> Hardened (&apos;) = private Key
        fließt ein → sicherer. Normal = öffentlicher Key → Watch-Only möglich.
      </InfoCard>
    </div>
  );
}

/* ── Step 5: BIP44 ── */
function Bip44Step({
  childKeys,
  loading,
  bip44,
  setBip44,
}: {
  masterKey: MasterKey | null;
  childKeys: MasterKey[];
  loading: boolean;
  bip44: Bip44Config;
  setBip44: React.Dispatch<React.SetStateAction<Bip44Config>>;
}) {
  const fk = childKeys.length >= 5 ? childKeys[4] : null;
  const cn = COIN_TYPES[bip44.coin] || `Custom (${bip44.coin})`;
  return (
    <div>
      <ExplainBox
        icon="📍"
        title="Was ist BIP44?"
        text="BIP44 standardisiert den Aufbau des Ableitungspfades."
        color="var(--accent-danger)"
        steps={[
          "<strong>m/44'</strong> — Purpose: zeigt an dass BIP44 verwendet wird.",
          "<strong>m/44'/coin'</strong> — Coin Type: 0 = Bitcoin, 60 = Ethereum, usw.",
          "<strong>m/44'/coin'/account'</strong> — Account: mehrere getrennte Konten.",
          "<strong>m/.../change</strong> — 0 = extern, 1 = intern.",
          "<strong>m/.../index</strong> — Adress-Index.",
        ]}
      />
      <Label>PFAD KONFIGURIEREN</Label>
      <div className="mb-4 grid grid-cols-4 gap-3 max-sm:grid-cols-2">
        {(
          [
            { k: "coin" as const, l: "Coin Type", h: cn },
            { k: "account" as const, l: "Account", h: "Index" },
            { k: "change" as const, l: "Change", h: "0/1" },
            { k: "index" as const, l: "Index", h: "Adress-Nr." },
          ] as const
        ).map((f) => (
          <div key={f.k}>
            <div className="mb-1.5 text-xs text-text-muted">{f.l}</div>
            <input
              type="number"
              min={0}
              max={f.k === "change" ? 1 : 999}
              className="w-full rounded-md border border-border-subtle bg-bg-primary p-2 text-center font-code text-base font-bold text-accent-primary outline-none focus:border-accent-secondary"
              value={bip44[f.k]}
              onChange={(e) =>
                setBip44((p) => ({
                  ...p,
                  [f.k]: parseInt(e.target.value) || 0,
                }))
              }
            />
            <div className="mt-1 text-[11px] text-text-muted">
              {f.k === "coin" ? cn : f.h}
            </div>
          </div>
        ))}
      </div>
      <Label>ABGELEITETER PFAD</Label>
      <div className="my-4 flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-bg-primary p-4 font-code text-[22px]">
        <span className="text-text-secondary">m</span>
        <span className="text-text-secondary">/</span>
        <span className="font-bold text-accent-secondary">44&apos;</span>
        <span className="text-text-secondary">/</span>
        <span className="font-bold text-accent-warning">{bip44.coin}&apos;</span>
        <span className="text-text-secondary">/</span>
        <span className="font-bold text-accent-primary">
          {bip44.account}&apos;
        </span>
        <span className="text-text-secondary">/</span>
        <span className="font-bold text-accent-danger">{bip44.change}</span>
        <span className="text-text-secondary">/</span>
        <span className="font-bold text-accent-success">{bip44.index}</span>
      </div>
      <Label>ABGELEITETER SCHLÜSSEL</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Spinner />
          Ableitung läuft…
        </div>
      ) : fk ? (
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="rounded-xl border border-accent-success/40 bg-bg-primary p-5">
            <div className="mb-3 font-code text-[13px] font-bold uppercase tracking-wider text-accent-success">
              PRIVATE KEY (32 Bytes)
            </div>
            <div className="break-all leading-8">
              {splitHex(toHex(fk.priv), 8).map((c, i) => (
                <span
                  key={i}
                  className="mr-1.5 mb-1 inline-block rounded bg-accent-success/12 px-2 py-1 font-code text-[15px] text-[#6ee7b7]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-accent-primary/40 bg-bg-primary p-5">
            <div className="mb-3 font-code text-[13px] font-bold uppercase tracking-wider text-accent-primary">
              CHAIN CODE (32 Bytes)
            </div>
            <div className="break-all leading-8">
              {splitHex(toHex(fk.chain), 8).map((c, i) => (
                <span
                  key={i}
                  className="mr-1.5 mb-1 inline-block rounded bg-accent-primary/15 px-2 py-1 font-code text-[15px] text-accent-primary"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({
  seed,
  masterKey,
}: {
  seed: Uint8Array | null;
  masterKey: MasterKey | null;
}) {
  return (
    <div className="flex flex-col gap-3.5 max-lg:hidden">
      {/* Seed Card */}
      {seed ? (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-card">
          <div className="flex items-center gap-2.5 border-b border-accent-success/20 bg-white/[0.015] px-4 py-3.5">
            <div className="h-3 w-3 rounded-full bg-accent-success" />
            <div className="font-body text-[15px] font-bold">🌱 512-Bit Seed</div>
            <span className="ml-auto rounded-[10px] border border-accent-success/30 bg-accent-success/10 px-2 py-0.5 font-code text-[10px] font-bold tracking-wider text-accent-success">
              64 BYTES
            </span>
          </div>
          <div className="p-4">
            <div className="mb-3 font-body text-[13px] leading-[1.7] text-text-secondary">
              Der Seed ist die Wurzel von allem.
            </div>
            <div className="break-all rounded-lg border border-border-subtle bg-bg-primary p-2.5 font-code text-[11px] leading-8 text-[#00cc6a]">
              {toHex(seed)}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-card opacity-40">
          <div className="flex items-center gap-2.5 border-b border-border-subtle bg-white/[0.015] px-4 py-3.5">
            <div className="h-3 w-3 rounded-full bg-border-active" />
            <div className="font-body text-[15px] font-bold text-text-muted">
              🌱 Seed
            </div>
          </div>
          <div className="p-4 font-body text-[13px] text-text-muted">
            Wird nach Mnemonic-Eingabe berechnet…
          </div>
        </div>
      )}

      {/* Master Key Card */}
      {masterKey ? (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-card">
          <div className="flex items-center gap-2.5 border-b border-accent-secondary/30 bg-white/[0.015] px-4 py-3.5">
            <div className="h-3 w-3 rounded-full bg-accent-secondary" />
            <div className="font-body text-[15px] font-bold">🗝️ Master Key</div>
            <span className="ml-auto rounded-[10px] border border-accent-secondary/30 bg-accent-secondary/12 px-2 py-0.5 font-code text-[10px] font-bold text-[#c4b5fd]">
              BIP32
            </span>
          </div>
          <div className="p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-accent-secondary" />
              <span className="font-code text-[11px] font-bold tracking-wider text-accent-secondary">
                MASTER PRIVATE KEY
              </span>
            </div>
            <div className="mb-3 break-all rounded-lg border border-border-subtle bg-bg-primary p-2.5 font-code text-[11px] leading-8 text-[#c4b5fd]">
              {toHex(masterKey.priv)}
            </div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
              <span className="font-code text-[11px] font-bold tracking-wider text-accent-primary">
                MASTER CHAIN CODE
              </span>
            </div>
            <div className="break-all rounded-lg border border-border-subtle bg-bg-primary p-2.5 font-code text-[11px] leading-8 text-accent-primary">
              {toHex(masterKey.chain)}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-card opacity-40">
          <div className="flex items-center gap-2.5 border-b border-border-subtle bg-white/[0.015] px-4 py-3.5">
            <div className="h-3 w-3 rounded-full bg-border-active" />
            <div className="font-body text-[15px] font-bold text-text-muted">
              🗝️ Master Key
            </div>
          </div>
          <div className="p-4 font-body text-[13px] text-text-muted">
            Wird nach Seed-Berechnung erzeugt…
          </div>
        </div>
      )}

      {/* BIP Reference */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-card">
        <div className="flex items-center gap-2.5 border-b border-border-subtle bg-white/[0.015] px-4 py-3.5">
          <div className="h-3 w-3 rounded-full bg-accent-primary" />
          <div className="font-body text-[15px] font-bold">📚 BIP Referenz</div>
        </div>
        <div className="p-4">
          {[
            { bip: "BIP39", col: "var(--accent-warning)", desc: "Mnemonic · 2048 Wörter" },
            { bip: "BIP32", col: "var(--accent-success)", desc: "HD Wallets · Schlüsselbäume" },
            { bip: "BIP44", col: "var(--accent-secondary)", desc: "m/44'/coin'/acct'/change/idx" },
            { bip: "BIP85", col: "#fb7185", desc: "Deterministische Child Entropy" },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 text-[13px]"
              style={{
                borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <span
                className="font-code font-bold text-[13px]"
                style={{ color: r.col }}
              >
                {r.bip}
              </span>
              <span className="text-xs text-text-secondary">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function BipPipelineVisualizer() {
  const [step, setStep] = useState(0);
  const [mnemonic, setMnemonic] = useState(DEFAULT_MNEMONIC);
  const [passphrase, setPassphrase] = useState("");
  const [seed, setSeed] = useState<Uint8Array | null>(null);
  const [masterKey, setMasterKey] = useState<MasterKey | null>(null);
  const [childKeys, setChildKeys] = useState<MasterKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [bip44, setBip44] = useState<Bip44Config>({
    coin: 0,
    account: 0,
    change: 0,
    index: 0,
  });

  // BIP32 derive
  const derive = useCallback(async () => {
    if (
      mnemonic
        .trim()
        .split(/\s+/)
        .filter(Boolean).length < 12
    )
      return;
    setLoading(true);
    try {
      const s = await mnemonicToSeed(mnemonic, passphrase);
      setSeed(s);
      const mk = await seedToMaster(s);
      setMasterKey(mk);
      const keys: MasterKey[] = [];
      let cur: MasterKey = { priv: mk.priv, chain: mk.chain };
      for (const [idx, hard] of [
        [44, true],
        [bip44.coin, true],
        [bip44.account, true],
        [bip44.change, false],
        [bip44.index, false],
      ] as [number, boolean][]) {
        const child = await childDerive(cur.priv, cur.chain, idx, hard);
        keys.push(child);
        cur = child;
      }
      setChildKeys(keys);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [mnemonic, passphrase, bip44]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    derive();
  }, [derive]);

  return (
    <div className="relative">
      {/* Step Nav */}
      <div className="mb-7 flex items-center gap-0 overflow-x-auto pb-1.5">
        {STEPS.map((s, i) => (
          <Fragment key={s.id}>
            <button
              className={`flex flex-shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl border px-5 py-3.5 font-code text-sm transition-all ${
                step === s.id
                  ? "border-accent-secondary bg-accent-secondary/15 text-white"
                  : seed && i > 0 && i < 6
                    ? "border-accent-success/30 bg-bg-card text-text-secondary"
                    : "border-border-subtle bg-bg-card text-text-secondary hover:border-border-active hover:text-text-primary"
              }`}
              onClick={() => setStep(s.id)}
            >
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  step === s.id
                    ? "bg-accent-secondary text-white"
                    : seed && i > 0 && i < 6
                      ? "bg-[#00cc6a] text-black"
                      : "bg-border-active"
                }`}
              >
                {seed && i > 0 && i < 6 ? "✓" : s.id}
              </div>
              <span>
                {s.icon} {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-0 h-px w-6 flex-shrink-0 ${
                  seed && i > 0 && i < 5
                    ? "bg-gradient-to-r from-[#00cc6a] to-border-active"
                    : "bg-gradient-to-r from-border-active to-border-subtle"
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-[14px] border border-border-subtle bg-bg-card">
          {/* Panel header */}
          <div className="flex items-center gap-3 border-b border-border-subtle bg-white/[0.02] px-5 py-5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: STEP_COLORS[step] }}
            />
            <div className="font-body text-lg font-bold tracking-wide">
              {STEPS[step].icon} {STEPS[step].label}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {loading && <Spinner />}
              <div className="flex gap-1.5">
                {step > 0 && (
                  <button
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-border-active bg-transparent px-4 py-2.5 font-code text-[13px] text-text-secondary transition-all hover:border-accent-primary hover:text-accent-primary"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    ← zurück
                  </button>
                )}
                {step < STEPS.length - 1 && (
                  <button
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-accent-secondary bg-accent-secondary/15 px-4 py-2.5 font-code text-[13px] text-white transition-all hover:bg-accent-secondary/30"
                    onClick={() => setStep((s) => s + 1)}
                  >
                    weiter →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Panel body */}
          <div className="p-8 max-sm:p-4">
            <FlowBar step={step} seed={seed} masterKey={masterKey} />
            {step === 0 && <OverviewStep onGo={setStep} />}
            {step === 1 && (
              <Bip39Step mnemonic={mnemonic} setMnemonic={setMnemonic} />
            )}
            {step === 2 && (
              <Pbkdf2Step
                mnemonic={mnemonic}
                passphrase={passphrase}
                setPassphrase={setPassphrase}
                seed={seed}
                loading={loading}
              />
            )}
            {step === 3 && (
              <MasterKeyStep seed={seed} masterKey={masterKey} loading={loading} />
            )}
            {step === 4 && (
              <ChildKeyStep
                masterKey={masterKey}
                childKeys={childKeys}
                loading={loading}
              />
            )}
            {step === 5 && (
              <Bip44Step
                masterKey={masterKey}
                childKeys={childKeys}
                loading={loading}
                bip44={bip44}
                setBip44={setBip44}
              />
            )}
          </div>
        </div>
        <Sidebar seed={seed} masterKey={masterKey} />
      </div>

      {/* Footer */}
      <div className="mt-5 rounded-xl border border-border-subtle bg-bg-card p-3.5 text-center font-code text-[10px] leading-[1.8] text-text-muted">
        NUR FÜR LERNZWECKE — Niemals echte Mnemonics in Browser-Apps eingeben
      </div>
    </div>
  );
}
