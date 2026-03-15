"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { sha256hex, h2b, b2hN, randHex, chk } from "./crypto-utils";
import { loadWordlist, getWord } from "./wordlist";
import type {
  Mode,
  WordEntry,
  TrngOption12,
  TrngOption24,
  Bip39State12,
  Bip39State24,
} from "./types";

/* ── Sub-components ── */

function ModeSelector({
  mode,
  onSetMode,
}: {
  mode: Mode;
  onSetMode: (m: Mode) => void;
}) {
  return (
    <div className="mb-6 flex gap-2 rounded-xl border border-border-subtle bg-bg-card p-1">
      <button
        className={`flex-1 rounded-lg px-4 py-3 font-body text-sm font-semibold transition-all ${
          mode === 12
            ? "border border-accent-success/30 bg-bg-card-hover text-accent-success"
            : "bg-transparent text-text-muted"
        }`}
        onClick={() => onSetMode(12)}
      >
        12 Wörter
      </button>
      <button
        className={`flex-1 rounded-lg px-4 py-3 font-body text-sm font-semibold transition-all ${
          mode === 24
            ? "border border-accent-success/30 bg-bg-card-hover text-accent-success"
            : "bg-transparent text-text-muted"
        }`}
        onClick={() => onSetMode(24)}
      >
        24 Wörter
      </button>
    </div>
  );
}

function Step({
  num,
  title,
  badge,
  active,
  blocked,
  children,
}: {
  num: number;
  title: string;
  badge: string;
  active: boolean;
  blocked: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(active);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active) setOpen(true);
  }, [active]);

  return (
    <div
      className={`overflow-hidden rounded-[14px] border transition-all ${
        active
          ? "border-accent-success/35 shadow-[0_0_24px_rgba(16,185,129,0.05)]"
          : "border-border-subtle"
      } ${blocked ? "opacity-40" : ""} bg-bg-card`}
    >
      <div
        className="flex cursor-pointer select-none items-center gap-4 px-5 py-4"
        onClick={() => setOpen(!open)}
      >
        <div
          className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full font-code text-xs font-bold ${
            active
              ? "border border-accent-success bg-accent-success/12 text-accent-success"
              : "border border-border-subtle bg-bg-card-hover text-text-muted"
          }`}
        >
          {num}
        </div>
        <div className="flex-1 text-[0.95rem] font-semibold text-text-primary">
          {title}
        </div>
        <span
          className={`rounded-[20px] px-2 py-0.5 font-code text-[0.62rem] ${
            active
              ? "border border-accent-success/25 bg-accent-success/8 text-accent-success"
              : "border border-border-subtle bg-bg-card-hover text-text-muted"
          }`}
        >
          {badge}
        </span>
      </div>
      {open && !blocked && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function InfoBox({
  variant,
  children,
}: {
  variant: "blue" | "green" | "orange" | "red";
  children: React.ReactNode;
}) {
  const styles = {
    blue: "border-accent-primary/20 bg-accent-primary/[0.07] text-[#a0b8d0]",
    green:
      "border-accent-success/20 bg-accent-success/[0.05] text-[#80d4a8]",
    orange:
      "border-accent-warning/25 bg-accent-warning/[0.07] text-[#d4a080]",
    red: "border-accent-danger/20 bg-accent-danger/[0.06] text-[#d08090]",
  };

  return (
    <div
      className={`my-3 rounded-lg border p-3 text-[0.83rem] leading-relaxed ${styles[variant]}`}
    >
      {children}
    </div>
  );
}

function BitsDisplay({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 break-all rounded-lg border border-border-subtle bg-bg-card-hover p-3 font-code text-[0.7rem] leading-8">
      {children}
    </div>
  );
}

function WordGrid({
  words,
  lastClass,
}: {
  words: WordEntry[];
  lastClass?: "orange" | "blue";
}) {
  return (
    <div className="my-3 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
      {words.map((w, i) => {
        const isLast = i === words.length - 1;
        const borderCls = isLast
          ? lastClass === "orange"
            ? "border-accent-warning/50 bg-accent-warning/[0.05]"
            : lastClass === "blue"
              ? "border-accent-primary/40 bg-accent-primary/[0.05]"
              : ""
          : "";
        const textCls = isLast
          ? lastClass === "orange"
            ? "text-accent-warning"
            : lastClass === "blue"
              ? "text-accent-primary"
              : ""
          : "";

        return (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card-hover px-3 py-2 ${borderCls}`}
          >
            <span className="w-[18px] flex-shrink-0 font-code text-[0.58rem] text-text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className={`text-[0.82rem] font-bold ${textCls}`}>
                {w.word}
              </div>
              <div className="font-code text-[0.55rem] text-text-muted">
                #{w.idx}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="min-w-[80px] flex-1 rounded-lg border border-border-subtle bg-bg-card-hover px-3 py-2">
      <div className="mb-1 font-code text-[0.58rem] tracking-wide text-text-muted">
        {label}
      </div>
      <div
        className="text-lg font-extrabold text-accent-success"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function HashBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 break-all rounded-lg border border-border-subtle bg-bg-card-hover p-3 font-code text-[0.68rem] leading-7 text-text-muted">
      {children}
    </div>
  );
}

/* ── Main Component ── */

export default function Bip39SeedVisualizer() {
  const [mode, setMode] = useState<Mode>(12);
  const [wordlist, setWordlist] = useState<string[]>([]);
  const [st12, setSt12] = useState<Bip39State12>({});
  const [st24, setSt24] = useState<Bip39State24>({});
  const [hex12Input, setHex12Input] = useState("");
  const [hex24Input, setHex24Input] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWordlist().then(setWordlist);
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-bip39-step]", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [mode]);

  const wrd = useCallback(
    (i: number) => getWord(wordlist, i),
    [wordlist]
  );

  const handleSetMode = (m: Mode) => {
    setMode(m);
    setSt12({});
    setSt24({});
  };

  /* ── 12 Word Logic ── */
  const run12 = async () => {
    const raw = hex12Input
      .trim()
      .replace(/[^0-9a-fA-F]/g, "")
      .toLowerCase();
    const hex = raw.padEnd(32, "0").slice(0, 32);
    const b121 = h2b(hex).slice(0, 121);
    const words11: WordEntry[] = [];
    for (let i = 0; i < 11; i++) {
      const b = b121.slice(i * 11, (i + 1) * 11);
      const idx = parseInt(b, 2);
      words11.push({ bits: b, idx, word: wrd(idx) });
    }

    const opts12: TrngOption12[] = [];
    for (let v = 0; v < 128; v++) {
      const sb = v.toString(2).padStart(7, "0");
      const full = b121 + sb;
      const hx = b2hN(full, 128);
      const hash = await sha256hex(hx);
      const cs = h2b(hash).slice(0, 4);
      const lb = sb + cs;
      const li = parseInt(lb, 2);
      opts12.push({ v, sb, cs, lb, li, word: wrd(li), hx, hash });
    }

    setSt12({ hex12: hex, b121, words11, opts12, trng12: null, sel12: null });
  };

  const simulateTRNG = async () => {
    // eslint-disable-next-line react-hooks/purity
    const v = Math.floor(Math.random() * 128);
    pick12(v, v);
  };

  const pick12 = (v: number, trngV?: number) => {
    if (!st12.opts12 || !st12.words11) return;
    const o = st12.opts12[v];
    setSt12((prev) => ({
      ...prev,
      sel12: v,
      trng12: trngV !== undefined ? trngV : prev.trng12,
      w12: [...prev.words11!, { bits: o.lb, idx: o.li, word: o.word }],
    }));
  };

  /* ── 24 Word Logic ── */
  const run24 = async () => {
    const raw = hex24Input
      .trim()
      .replace(/[^0-9a-fA-F]/g, "")
      .toLowerCase();
    const hex = raw.padEnd(64, "0").slice(0, 64);
    const b253 = h2b(hex).slice(0, 253);
    const words23: WordEntry[] = [];
    for (let i = 0; i < 23; i++) {
      const b = b253.slice(i * 11, (i + 1) * 11);
      const idx = parseInt(b, 2);
      words23.push({ bits: b, idx, word: wrd(idx) });
    }

    const opts24: TrngOption24[] = [];
    for (let v = 0; v < 8; v++) {
      const tb = v.toString(2).padStart(3, "0");
      const full = b253 + tb;
      const hx = b2hN(full, 256);
      const hash = await sha256hex(hx);
      const cs = h2b(hash).slice(0, 8);
      const lb = tb + cs;
      const li = parseInt(lb, 2);
      opts24.push({ v, tb, cs, lb, li, word: wrd(li), hx, hash });
    }

    setSt24({ hex24: hex, b253, words23, opts24, sel24: null });
  };

  const pick24 = (v: number) => {
    if (!st24.opts24 || !st24.words23) return;
    const o = st24.opts24[v];
    setSt24((prev) => ({
      ...prev,
      sel24: v,
      w24: [...prev.words23!, { bits: o.lb, idx: o.li, word: o.word }],
    }));
  };

  /* ── Render 12-word pipeline ── */
  const render12 = () => {
    const has11 = !!st12.b121;
    const hasSel = st12.sel12 !== null && st12.sel12 !== undefined;
    const o = hasSel ? st12.opts12![st12.sel12!] : null;

    return (
      <div className="flex flex-col gap-3" ref={containerRef}>
        <div data-bip39-step>
          <Step num={1} title="11 Wörter würfeln" badge="121 bit" active blocked={false}>
            <InfoBox variant="orange">
              Du würfelst nur <strong>11 Wörter selbst</strong> = 11 × 11 bit ={" "}
              <strong>121 bit</strong>.<br />
              Die fehlenden <strong>7 bit Entropy</strong> kommen vom TRNG der
              BitBox.
              <br />
              <br />
              12. Wort ={" "}
              <span className="text-accent-warning">7 bit TRNG</span> +{" "}
              <span className="text-accent-danger">4 bit Prüfsumme (SHA256)</span>
            </InfoBox>

            <label className="mb-1.5 block font-code text-[0.65rem] tracking-wide text-text-muted">
              DEINE 11-WORT ENTROPY (HEX) — ersten 121 bit werden genutzt
            </label>
            <textarea
              className="w-full resize-none rounded-lg border border-border-subtle bg-bg-card-hover px-3 py-2.5 font-code text-[0.78rem] text-text-primary outline-none transition-colors focus:border-accent-success"
              rows={2}
              placeholder="z.B. 0c1e24e5917779d297e14f45..."
              value={hex12Input}
              onChange={(e) => setHex12Input(e.target.value)}
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-accent-success px-4 py-2 font-body text-[0.82rem] font-semibold text-black transition-all hover:-translate-y-px hover:bg-[#00ffaa]"
                onClick={run12}
              >
                11 Wörter ableiten →
              </button>
              <button
                className="rounded-lg border border-border-subtle bg-bg-card-hover px-4 py-2 font-body text-[0.82rem] font-semibold text-text-primary transition-colors hover:border-accent-success hover:text-accent-success"
                onClick={() => {
                  const h = randHex(16);
                  setHex12Input(h);
                  setSt12((prev) => ({ ...prev, hex12: h }));
                  // auto-run after state update
                  setTimeout(async () => {
                    const b121 = h2b(h).slice(0, 121);
                    const words11: WordEntry[] = [];
                    for (let i = 0; i < 11; i++) {
                      const b = b121.slice(i * 11, (i + 1) * 11);
                      const idx = parseInt(b, 2);
                      words11.push({ bits: b, idx, word: wrd(idx) });
                    }
                    const opts12: TrngOption12[] = [];
                    for (let v = 0; v < 128; v++) {
                      const sb = v.toString(2).padStart(7, "0");
                      const full = b121 + sb;
                      const hx = b2hN(full, 128);
                      const hash = await sha256hex(hx);
                      const cs = h2b(hash).slice(0, 4);
                      const lb = sb + cs;
                      const li = parseInt(lb, 2);
                      opts12.push({ v, sb, cs, lb, li, word: wrd(li), hx, hash });
                    }
                    setSt12({
                      hex12: h,
                      b121,
                      words11,
                      opts12,
                      trng12: null,
                      sel12: null,
                    });
                  }, 0);
                }}
              >
                Zufällig
              </button>
            </div>

            {has11 && (
              <>
                <div className="my-3 h-px bg-border-subtle" />
                <div className="flex flex-wrap gap-2">
                  <StatBox label="DEINE BITS" value="121 bit" />
                  <StatBox
                    label="FEHLEND (TRNG)"
                    value="7 bit"
                    color="var(--accent-warning)"
                  />
                  <StatBox label="WÖRTER BISHER" value="11 / 12" />
                </div>

                <BitsDisplay>
                  <div className="mb-1.5 font-code text-[0.62rem] text-text-muted">
                    DEINE 121 BITS (11 × 11 bit) — die letzten 7 bit fehlen noch:
                  </div>
                  {chk(st12.b121!, 11).map((b, i) => (
                    <span
                      key={i}
                      className="mx-0.5 my-px inline-block rounded bg-accent-success/8 px-1 text-accent-success"
                    >
                      {b}
                    </span>
                  ))}
                  <span className="mx-0.5 my-px inline-block rounded bg-accent-warning/10 px-1 text-accent-warning">
                    {" "}
                    ???????
                  </span>
                </BitsDisplay>

                <div className="my-3 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                  {st12.words11!.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card-hover px-3 py-2"
                    >
                      <span className="w-[18px] flex-shrink-0 font-code text-[0.58rem] text-text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="text-[0.82rem] font-bold">{w.word}</div>
                        <div className="font-code text-[0.55rem] text-text-muted">
                          #{w.idx}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-accent-warning/30 bg-accent-warning/[0.03] px-3 py-2">
                    <span className="w-[18px] flex-shrink-0 font-code text-[0.58rem] text-text-muted">
                      12
                    </span>
                    <div>
                      <div className="text-[0.82rem] font-bold text-accent-warning">
                        ???
                      </div>
                      <div className="font-code text-[0.55rem] text-text-muted">
                        → TRNG
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={2}
            title="TRNG erzeugt 7 fehlende Bits"
            badge="128 Optionen"
            active={has11}
            blocked={!has11}
          >
            {has11 && st12.opts12 && (
              <>
                <InfoBox variant="orange">
                  Der TRNG der BitBox erzeugt <strong>7 zufällige Bits</strong> aus
                  physikalischem Rauschen.
                  <br />
                  Das ergibt 2⁷ = <strong>128 mögliche Optionen</strong> für das
                  12. Wort.
                  <br />
                  BitBox wählt automatisch eine — du hast hier keinen Einfluss.
                </InfoBox>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg bg-accent-warning px-4 py-2 font-body text-[0.82rem] font-semibold text-black transition-all hover:-translate-y-px hover:opacity-85"
                    onClick={simulateTRNG}
                  >
                    BitBox TRNG simulieren
                  </button>
                </div>
                <InfoBox variant="blue">
                  Alle 128 möglichen 12. Wörter (je nach TRNG-Wert):
                </InfoBox>
                <div className="my-3 grid max-h-[280px] grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-1.5 overflow-y-auto">
                  {st12.opts12.map((opt) => (
                    <div
                      key={opt.v}
                      className={`rounded-md border px-2.5 py-2 text-[0.75rem] ${
                        st12.trng12 === opt.v
                          ? "border-accent-warning bg-accent-warning/10"
                          : "border-border-subtle bg-bg-card-hover"
                      }`}
                    >
                      <div className="font-code text-[0.58rem] text-text-muted">
                        <span className="text-accent-warning">{opt.sb}</span>+
                        <span className="text-accent-danger">{opt.cs}</span>
                      </div>
                      <div className="font-bold text-accent-warning">{opt.word}</div>
                    </div>
                  ))}
                </div>
                {st12.trng12 !== null && st12.trng12 !== undefined && (
                  <InfoBox variant="orange">
                    TRNG hat gewählt: 7-bit ={" "}
                    <strong className="text-accent-warning">
                      {st12.opts12[st12.trng12].sb}
                    </strong>{" "}
                    → Wort:{" "}
                    <strong>&quot;{st12.opts12[st12.trng12].word}&quot;</strong>
                  </InfoBox>
                )}
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={3}
            title="SHA256 → 4 bit Prüfsumme"
            badge="deterministisch"
            active={hasSel}
            blocked={!hasSel}
          >
            {hasSel && o && (
              <>
                <InfoBox variant="blue">
                  TRNG-Wahl: 7 bit ={" "}
                  <strong className="text-accent-warning">{o.sb}</strong>
                  <br />
                  BitBox rechnet: SHA256(
                  <span className="text-accent-success">121 bit</span> +{" "}
                  <span className="text-accent-warning">{o.sb}</span>) → erste 4
                  bit = Prüfsumme
                </InfoBox>
                <HashBox>
                  128-bit Entropy (121 bit deine +{" "}
                  <span className="text-accent-warning">{o.sb}</span> TRNG):
                  <br />
                  <span className="text-accent-success">{o.hx}</span>
                  <br />
                  <br />
                  SHA256 =<br />
                  <span className="font-bold text-accent-danger">
                    {o.hash.slice(0, 1)}
                  </span>
                  {o.hash.slice(1)}
                  <br />
                  <br />
                  Binär (erste 8 bit):{" "}
                  <span className="font-bold text-accent-danger">
                    {h2b(o.hash).slice(0, 4)}
                  </span>
                  {h2b(o.hash).slice(4, 8)}...
                  <br />→ Prüfsumme ={" "}
                  <span className="font-bold text-accent-danger">{o.cs}</span>{" "}
                  (erste 4 bit)
                </HashBox>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={4}
            title="12. Wort zusammensetzen"
            badge="7 bit + 4 bit = 11 bit"
            active={hasSel}
            blocked={!hasSel}
          >
            {hasSel && o && (
              <>
                <InfoBox variant="orange">
                  <span className="text-accent-warning">{o.sb}</span> (7 bit TRNG)
                  +{" "}
                  <span className="text-accent-danger">{o.cs}</span> (4 bit
                  Prüfsumme)
                  <br />={" "}
                  <span className="font-code">{o.lb}</span> (11 bit) = Index #{o.li}{" "}
                  ={" "}
                  <strong className="text-lg text-accent-warning">
                    &quot;{o.word}&quot;
                  </strong>
                </InfoBox>
                <BitsDisplay>
                  <span className="mx-0.5 my-px inline-block rounded bg-accent-warning/10 px-1 text-accent-warning">
                    {o.sb}
                  </span>
                  <span className="mx-0.5 my-px inline-block rounded bg-accent-danger/10 px-1 text-accent-danger">
                    {o.cs}
                  </span>{" "}
                  → {parseInt(o.lb, 2)} →{" "}
                  <strong className="text-accent-warning">
                    &quot;{o.word}&quot;
                  </strong>
                </BitsDisplay>
                <InfoBox variant="red">
                  <strong>Die 7 TRNG-Bits stammen von der BitBox, nicht von dir.</strong>
                  <br />
                  Du hast keinen Einfluss darauf — das ist der strukturelle
                  Unterschied zu 24 Wörtern.
                </InfoBox>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={5}
            title="Fertiger Seed — alle 12 Wörter"
            badge="121 bit du + 7 bit TRNG"
            active={hasSel}
            blocked={!hasSel}
          >
            {hasSel && st12.w12 && (
              <>
                <div className="flex flex-wrap gap-2">
                  <StatBox label="DEINE 11 WÖRTER" value="121 bit" />
                  <StatBox
                    label="TRNG (BitBox)"
                    value="7 bit"
                    color="var(--accent-warning)"
                  />
                  <StatBox
                    label="PRÜFSUMME"
                    value="4 bit"
                    color="var(--accent-danger)"
                  />
                  <StatBox label="GESAMT" value="132 bit" />
                </div>
                <WordGrid words={st12.w12} lastClass="orange" />
                <InfoBox variant="orange">
                  <strong>Vergleich mit 24 Wörtern:</strong>
                  <br />
                  12 Wörter: 7 bit vom TRNG → BitBox trägt Entropy bei
                  <br />
                  24 Wörter: 0 bit vom TRNG → du hast 100% Kontrolle
                </InfoBox>
              </>
            )}
          </Step>
        </div>
      </div>
    );
  };

  /* ── Render 24-word pipeline ── */
  const render24 = () => {
    const has23 = !!st24.b253;
    const hasSel = st24.sel24 !== null && st24.sel24 !== undefined;
    const o = hasSel ? st24.opts24![st24.sel24!] : null;

    return (
      <div className="flex flex-col gap-3" ref={containerRef}>
        <div data-bip39-step>
          <Step num={1} title="23 Wörter würfeln" badge="253 bit" active blocked={false}>
            <InfoBox variant="blue">
              Du würfelst <strong>23 Wörter selbst</strong> = 23 × 11 bit ={" "}
              <strong>253 bit</strong>.<br />
              Die fehlenden <strong>3 bit Entropy</strong> wählst du selbst in
              Schritt 2.
              <br />
              <br />
              24. Wort ={" "}
              <span className="text-accent-success">3 bit (du)</span> +{" "}
              <span className="text-accent-danger">
                8 bit Prüfsumme (SHA256)
              </span>
            </InfoBox>

            <label className="mb-1.5 block font-code text-[0.65rem] tracking-wide text-text-muted">
              DEINE 23-WORT ENTROPY (HEX) — ersten 253 bit werden genutzt
            </label>
            <textarea
              className="w-full resize-none rounded-lg border border-border-subtle bg-bg-card-hover px-3 py-2.5 font-code text-[0.78rem] text-text-primary outline-none transition-colors focus:border-accent-success"
              rows={2}
              placeholder="z.B. a3f1... (mind. 32 hex-zeichen)"
              value={hex24Input}
              onChange={(e) => setHex24Input(e.target.value)}
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-accent-success px-4 py-2 font-body text-[0.82rem] font-semibold text-black transition-all hover:-translate-y-px hover:bg-[#00ffaa]"
                onClick={run24}
              >
                23 Wörter ableiten →
              </button>
              <button
                className="rounded-lg border border-border-subtle bg-bg-card-hover px-4 py-2 font-body text-[0.82rem] font-semibold text-text-primary transition-colors hover:border-accent-success hover:text-accent-success"
                onClick={() => {
                  const h = randHex(32);
                  setHex24Input(h);
                  setTimeout(async () => {
                    const b253 = h2b(h).slice(0, 253);
                    const words23: WordEntry[] = [];
                    for (let i = 0; i < 23; i++) {
                      const b = b253.slice(i * 11, (i + 1) * 11);
                      const idx = parseInt(b, 2);
                      words23.push({ bits: b, idx, word: wrd(idx) });
                    }
                    const opts24: TrngOption24[] = [];
                    for (let v = 0; v < 8; v++) {
                      const tb = v.toString(2).padStart(3, "0");
                      const full = b253 + tb;
                      const hx = b2hN(full, 256);
                      const hash = await sha256hex(hx);
                      const cs = h2b(hash).slice(0, 8);
                      const lb = tb + cs;
                      const li = parseInt(lb, 2);
                      opts24.push({ v, tb, cs, lb, li, word: wrd(li), hx, hash });
                    }
                    setSt24({ hex24: h, b253, words23, opts24, sel24: null });
                  }, 0);
                }}
              >
                Zufällig
              </button>
            </div>

            {has23 && (
              <>
                <div className="my-3 h-px bg-border-subtle" />
                <div className="flex flex-wrap gap-2">
                  <StatBox label="DEINE BITS" value="253 bit" />
                  <StatBox
                    label="FEHLEND"
                    value="3 bit"
                    color="var(--accent-success)"
                  />
                  <StatBox label="WÖRTER BISHER" value="23 / 24" />
                </div>

                <BitsDisplay>
                  <div className="mb-1.5 font-code text-[0.62rem] text-text-muted">
                    DEINE 253 BITS (23 × 11 bit) — 3 bit fehlen noch:
                  </div>
                  {chk(st24.b253!, 11).map((b, i) => (
                    <span
                      key={i}
                      className="mx-0.5 my-px inline-block rounded bg-accent-success/8 px-1 text-accent-success"
                    >
                      {b}
                    </span>
                  ))}
                  <span className="mx-0.5 my-px inline-block rounded bg-accent-warning/10 px-1 text-accent-warning">
                    {" "}
                    ???
                  </span>
                </BitsDisplay>

                <div className="my-3 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                  {st24.words23!.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card-hover px-3 py-2"
                    >
                      <span className="w-[18px] flex-shrink-0 font-code text-[0.58rem] text-text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="text-[0.82rem] font-bold">{w.word}</div>
                        <div className="font-code text-[0.55rem] text-text-muted">
                          #{w.idx}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-accent-warning/30 bg-accent-warning/[0.03] px-3 py-2">
                    <span className="w-[18px] flex-shrink-0 font-code text-[0.58rem] text-text-muted">
                      24
                    </span>
                    <div>
                      <div className="text-[0.82rem] font-bold text-accent-warning">
                        ???
                      </div>
                      <div className="font-code text-[0.55rem] text-text-muted">
                        → Schritt 2
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={2}
            title="3 fehlende Bit wählen → 8 Optionen"
            badge="du entscheidest"
            active={has23}
            blocked={!has23}
          >
            {has23 && st24.opts24 && (
              <>
                <InfoBox variant="green">
                  Die 3 fehlenden Bits ergeben 2³ ={" "}
                  <strong>8 mögliche Kombinationen</strong>.<br />
                  Für jede berechnet BitBox SHA256 und zeigt dir 8 valide 24.
                  Wörter.
                  <br />
                  <strong>Du wählst eine</strong> — z.B. durch nochmaliges Würfeln
                  (1–8).
                </InfoBox>
                <div className="my-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                  {st24.opts24.map((opt) => (
                    <div
                      key={opt.v}
                      className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-all hover:border-accent-primary hover:bg-accent-primary/[0.06] ${
                        st24.sel24 === opt.v
                          ? "border-accent-primary bg-accent-primary/10"
                          : "border-border-subtle bg-bg-card-hover"
                      }`}
                      onClick={() => pick24(opt.v)}
                    >
                      <div className="font-code text-[0.6rem] text-text-muted">
                        3-bit:{" "}
                        <span className="text-accent-success">{opt.tb}</span> + CS:{" "}
                        <span className="text-accent-danger">{opt.cs}</span>
                      </div>
                      <div className="text-[0.95rem] font-bold text-accent-primary">
                        {opt.word}
                      </div>
                      <div className="font-code text-[0.58rem] text-text-muted">
                        #{opt.li}
                      </div>
                    </div>
                  ))}
                </div>
                <InfoBox variant="green">
                  Du entscheidest — BitBox erfindet keine eigene Entropy.
                </InfoBox>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={3}
            title="SHA256 → 8 bit Prüfsumme"
            badge="deterministisch"
            active={hasSel}
            blocked={!hasSel}
          >
            {hasSel && o && (
              <>
                <InfoBox variant="blue">
                  Deine Wahl: 3 bit ={" "}
                  <strong className="text-accent-success">{o.tb}</strong>
                  <br />
                  BitBox rechnet: SHA256(
                  <span className="text-accent-success">253 bit</span> +{" "}
                  <span className="text-accent-success">{o.tb}</span>) → erste 8
                  bit = Prüfsumme
                </InfoBox>
                <HashBox>
                  256-bit Entropy (hex):
                  <br />
                  <span className="text-accent-success">{o.hx}</span>
                  <br />
                  <br />
                  SHA256 =<br />
                  <span className="font-bold text-accent-danger">
                    {o.hash.slice(0, 2)}
                  </span>
                  {o.hash.slice(2)}
                  <br />
                  <br />→ Prüfsumme = erste 8 bit:{" "}
                  <span className="font-bold text-accent-danger">{o.cs}</span>
                </HashBox>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={4}
            title="24. Wort zusammensetzen"
            badge="3 bit + 8 bit = 11 bit"
            active={hasSel}
            blocked={!hasSel}
          >
            {hasSel && o && (
              <>
                <InfoBox variant="green">
                  <span className="text-accent-success">{o.tb}</span> (3 bit, deine
                  Wahl) +{" "}
                  <span className="text-accent-danger">{o.cs}</span> (8 bit
                  Prüfsumme)
                  <br />={" "}
                  <span className="font-code">{o.lb}</span> (11 bit) = Index #{o.li}{" "}
                  ={" "}
                  <strong className="text-lg text-accent-primary">
                    &quot;{o.word}&quot;
                  </strong>
                </InfoBox>
                <BitsDisplay>
                  <span className="mx-0.5 my-px inline-block rounded bg-accent-success/8 px-1 text-accent-success">
                    {o.tb}
                  </span>
                  <span className="mx-0.5 my-px inline-block rounded bg-accent-danger/10 px-1 text-accent-danger">
                    {o.cs}
                  </span>{" "}
                  → {parseInt(o.lb, 2)} →{" "}
                  <strong className="text-accent-primary">
                    &quot;{o.word}&quot;
                  </strong>
                </BitsDisplay>
              </>
            )}
          </Step>
        </div>

        <div data-bip39-step>
          <Step
            num={5}
            title="Fertiger Seed — alle 24 Wörter"
            badge="100% deine Entropy"
            active={hasSel}
            blocked={!hasSel}
          >
            {hasSel && st24.w24 && (
              <>
                <div className="flex flex-wrap gap-2">
                  <StatBox label="DEINE 23 WÖRTER" value="253 bit" />
                  <StatBox
                    label="DEINE WAHL"
                    value="3 bit"
                    color="var(--accent-success)"
                  />
                  <StatBox
                    label="PRÜFSUMME"
                    value="8 bit"
                    color="var(--accent-danger)"
                  />
                  <StatBox label="GESAMT" value="264 bit" />
                </div>
                <WordGrid words={st24.w24} lastClass="blue" />
                <InfoBox variant="green">
                  <strong>Du hast alle 256 bit Entropy selbst erzeugt.</strong>
                  <br />
                  BitBox hat nur SHA256 berechnet — kein TRNG, keine eigene
                  Entropy.
                </InfoBox>
                <InfoBox variant="orange">
                  <strong>Vergleich mit 12 Wörtern:</strong>
                  <br />
                  12 Wörter: 7 bit vom TRNG → BitBox trägt Entropy bei
                  <br />
                  24 Wörter: 0 bit vom TRNG → du hast 100% Kontrolle
                </InfoBox>
              </>
            )}
          </Step>
        </div>
      </div>
    );
  };

  return (
    <div>
      <ModeSelector mode={mode} onSetMode={handleSetMode} />
      {mode === 12 ? render12() : render24()}
    </div>
  );
}
