"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { sha256 } from "../crypto-utils";
import { DEFAULT_MINERS, DIFFICULTY_DEFAULT, NONCES_PER_FRAME } from "../constants";
import HexBreakdown from "@/components/visualizations/hashing/components/HexBreakdown";

interface RaceMiner {
  id: string;
  name: string;
  hashrate: number;
  nonce: number;
  currentHash: string;
  isWinner: boolean;
}

type RaceStatus = "idle" | "racing" | "finished";

const RACE_INFO = [
  {
    icon: "🎚️",
    title: "Hashrate einstellen",
    text: "Der Schieberegler bestimmt die Rechenpower jedes Miners — je höher, desto mehr Hash-Versuche pro Sekunde.",
  },
  {
    icon: "🏁",
    title: "Das Rennen",
    text: "Alle Miner starten gleichzeitig und probieren Nonces durch. Wer zuerst einen Hash mit genug führenden Nullen findet, gewinnt den Block.",
  },
  {
    icon: "🎲",
    title: "Zufall vs. Power",
    text: "Doppelte Hashrate = doppelte Gewinnchance. Aber auch ein kleiner Miner kann Glück haben — Mining ist ein probabilistischer Wettbewerb.",
  },
] as const;

const MINER_COLORS: Record<string, { bar: string; text: string; ring: string }> = {
  you: { bar: "bg-accent-primary", text: "text-accent-primary", ring: "ring-accent-primary/60" },
  "miner-a": { bar: "bg-accent-secondary", text: "text-accent-secondary", ring: "ring-accent-secondary/60" },
  "miner-b": { bar: "bg-accent-success", text: "text-accent-success", ring: "ring-accent-success/60" },
  "miner-c": { bar: "bg-accent-warning", text: "text-accent-warning", ring: "ring-accent-warning/60" },
};

export default function MiningRace() {
  const [miners, setMiners] = useState<RaceMiner[]>(
    DEFAULT_MINERS.map((m) => ({
      ...m,
      nonce: 0,
      currentHash: "",
      isWinner: false,
    }))
  );
  const [raceStatus, setRaceStatus] = useState<RaceStatus>("idle");
  const [winner, setWinner] = useState<string | null>(null);
  const [difficulty] = useState(DIFFICULTY_DEFAULT);

  const rafRef = useRef<number>(0);
  const minersRef = useRef<RaceMiner[]>(miners);
  const statusRef = useRef<RaceStatus>("idle");
  const infoRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const winnerRef = useRef<HTMLDivElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);

  const targetPrefix = "0".repeat(difficulty);
  const expectedAttempts = Math.pow(16, difficulty);

  // Info cards entrance animation
  useEffect(() => {
    if (!infoRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-race-info]", {
        y: 15,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, infoRef);
    return () => ctx.revert();
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!lanesRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-miner-lane]", {
        x: -30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, lanesRef);
    return () => ctx.revert();
  }, []);

  const updateHashrate = useCallback((id: string, hashrate: number) => {
    setMiners((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, hashrate } : m
      );
      minersRef.current = updated;
      return updated;
    });
  }, []);

  const startRace = useCallback(async () => {
    const resetMiners = minersRef.current.map((m) => ({
      ...m,
      nonce: 0,
      currentHash: "",
      isWinner: false,
    }));
    minersRef.current = resetMiners;
    setMiners(resetMiners);
    setWinner(null);
    statusRef.current = "racing";
    setRaceStatus("racing");

    const totalHashrate = minersRef.current.reduce(
      (sum, m) => sum + m.hashrate,
      0
    );

    const raceFrame = async () => {
      if (statusRef.current !== "racing") return;

      const currentMiners = [...minersRef.current];

      for (const miner of currentMiners) {
        const batchSize = Math.max(
          1,
          Math.round((miner.hashrate / totalHashrate) * NONCES_PER_FRAME)
        );

        for (let i = 0; i < batchSize; i++) {
          if (statusRef.current !== "racing") return;

          const input = `race-${miner.id}-${miner.nonce}`;
          const hex = await sha256(input);
          miner.nonce++;
          miner.currentHash = hex;

          if (hex.startsWith(targetPrefix)) {
            miner.isWinner = true;
            statusRef.current = "finished";
            setRaceStatus("finished");
            setWinner(miner.id);
            minersRef.current = currentMiners;
            setMiners([...currentMiners]);
            cancelAnimationFrame(rafRef.current);
            return;
          }
        }
      }

      minersRef.current = currentMiners;
      setMiners([...currentMiners]);
      rafRef.current = requestAnimationFrame(raceFrame);
    };

    rafRef.current = requestAnimationFrame(raceFrame);
  }, [targetPrefix]);

  // Winner animation with glow pulse + particles
  useEffect(() => {
    if (!winner) return;

    // Glow pulse on winner lane
    if (lanesRef.current) {
      const winnerLane = lanesRef.current.querySelector("[data-winner]");
      if (winnerLane) {
        gsap.to(winnerLane, {
          boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
          repeat: 2,
          yoyo: true,
          duration: 0.5,
        });
      }

      // Fade losers
      const losers = lanesRef.current.querySelectorAll(
        "[data-miner-lane]:not([data-winner])"
      );
      gsap.to(losers, {
        opacity: 0.4,
        filter: "grayscale(80%)",
        duration: 0.5,
        ease: "power2.out",
      });
    }

    // Winner announcement entrance
    if (winnerRef.current) {
      gsap.from(winnerRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    }

    // Confetti particles
    if (particleContainerRef.current) {
      const container = particleContainerRef.current;
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement("div");
        particle.className = "absolute h-1.5 w-1.5 rounded-full";
        particle.style.backgroundColor = [
          "#22d3ee",
          "#8b5cf6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
        ][i % 5];
        particle.style.left = `${10 + Math.random() * 80}%`;
        particle.style.bottom = "0";
        container.appendChild(particle);

        gsap.to(particle, {
          y: -(30 + Math.random() * 40),
          x: (Math.random() - 0.5) * 40,
          opacity: 0,
          duration: 0.8 + Math.random() * 0.4,
          ease: "power2.out",
          delay: Math.random() * 0.2,
          onComplete: () => particle.remove(),
        });
      }
    }
  }, [winner]);

  // Cleanup
  useEffect(() => {
    return () => {
      statusRef.current = "idle";
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const winnerMiner = miners.find((m) => m.id === winner);

  /** Render leading zeros as colored dots */
  const renderLeadingZeroDots = (hash: string) => {
    if (!hash) return null;
    const dots = [];
    for (let i = 0; i < difficulty; i++) {
      const ch = hash[i] || "?";
      dots.push(
        <span
          key={i}
          className={`inline-block h-2.5 w-2.5 rounded-sm ${
            ch === "0" ? "bg-accent-success" : "bg-accent-danger/60"
          }`}
          title={ch}
        />
      );
    }
    return <span className="inline-flex gap-0.5">{dots}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Info Cards */}
      <div ref={infoRef} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {RACE_INFO.map((info) => (
          <div
            key={info.title}
            data-race-info
            className="rounded-lg border border-border-subtle bg-bg-card p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg leading-none">{info.icon}</span>
              <span className="font-display text-xs font-semibold text-text-primary">
                {info.title}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              {info.text}
            </p>
          </div>
        ))}
      </div>

      {/* Miner Lanes */}
      <div ref={lanesRef} className="space-y-3">
        {miners.map((miner) => {
          const colors = MINER_COLORS[miner.id] || MINER_COLORS.you;
          const progressPercent = Math.min(
            (miner.nonce / expectedAttempts) * 100,
            100
          );
          const hashratePercent = miner.hashrate;

          return (
            <div
              key={miner.id}
              data-miner-lane
              data-winner={miner.isWinner ? "" : undefined}
              className={`relative overflow-hidden rounded-lg border p-3 transition-all ${
                miner.isWinner
                  ? "border-accent-success/50 bg-accent-success/5"
                  : "border-border-subtle bg-bg-card"
              }`}
            >
              {/* Particle container for winner */}
              {miner.isWinner && (
                <div
                  ref={particleContainerRef}
                  className="pointer-events-none absolute inset-0"
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                {/* Name */}
                <span
                  className={`font-display text-sm font-semibold ${colors.text}`}
                >
                  {miner.name}
                  {miner.isWinner && " 🏆"}
                </span>

                {/* Hashrate Slider + Visual Bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={miner.hashrate}
                    onChange={(e) =>
                      updateHashrate(miner.id, Number(e.target.value))
                    }
                    disabled={raceStatus === "racing"}
                    className="w-20 accent-accent-primary sm:w-28"
                  />
                  <span className="font-code text-xs text-text-muted">
                    {miner.hashrate} H/s
                  </span>
                </div>

                {/* Live Stats */}
                {raceStatus !== "idle" && (
                  <div className="ml-auto flex items-center gap-3">
                    {/* Leading zeros dots */}
                    {miner.currentHash && renderLeadingZeroDots(miner.currentHash)}
                    <span className="font-code text-xs text-text-secondary">
                      #{miner.nonce.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Hashrate visual bar */}
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${colors.bar} opacity-40 transition-all duration-300`}
                  style={{ width: `${hashratePercent}%` }}
                />
              </div>

              {/* Progress bar (race lane) */}
              {raceStatus !== "idle" && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${colors.bar} transition-all duration-150`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="font-code text-[10px] text-text-muted">
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <button
        onClick={startRace}
        disabled={raceStatus === "racing"}
        className={`rounded-lg px-5 py-2.5 font-display text-sm font-semibold transition-colors ${
          raceStatus === "racing"
            ? "bg-accent-warning/20 text-accent-warning"
            : "bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30"
        }`}
      >
        {raceStatus === "racing"
          ? "Rennen läuft..."
          : raceStatus === "finished"
            ? "Nochmal starten"
            : "Rennen starten"}
      </button>

      {/* Racing indicator */}
      {raceStatus === "racing" && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent-warning" />
          <span className="font-code text-xs text-text-muted">
            Miner suchen nach gültigem Hash (Difficulty {difficulty})...
          </span>
        </div>
      )}

      {/* Winner Announcement */}
      {winnerMiner && (
        <div
          ref={winnerRef}
          className="space-y-3 rounded-xl border border-accent-success/30 bg-accent-success/5 p-4"
        >
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent-success"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
            <span className="font-display text-sm font-semibold text-accent-success">
              {winnerMiner.name} gewinnt!
            </span>
          </div>

          <HexBreakdown hex={winnerMiner.currentHash} label="Gewinner-Hash" />

          {/* Post-race stats table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-code text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted">
                  <th className="py-1.5 pr-3 text-left font-medium">Miner</th>
                  <th className="px-3 py-1.5 text-right font-medium">Versuche</th>
                  <th className="px-3 py-1.5 text-right font-medium">% Erwartung</th>
                  <th className="pl-3 py-1.5 text-right font-medium">Glücksfaktor</th>
                </tr>
              </thead>
              <tbody>
                {miners.map((m) => {
                  const colors = MINER_COLORS[m.id] || MINER_COLORS.you;
                  const pctExpected =
                    expectedAttempts > 0
                      ? ((m.nonce / expectedAttempts) * 100).toFixed(1)
                      : "—";
                  const luckFactor =
                    m.nonce > 0 ? expectedAttempts / m.nonce : 0;
                  const isLucky = luckFactor >= 1;
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-border-subtle/50 ${
                        m.isWinner ? "bg-accent-success/5" : ""
                      }`}
                    >
                      <td className={`py-1.5 pr-3 font-semibold ${colors.text}`}>
                        {m.name}
                        {m.isWinner && " 🏆"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-secondary">
                        {m.nonce.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-secondary">
                        {pctExpected}%
                      </td>
                      <td
                        className={`pl-3 py-1.5 text-right font-semibold ${
                          m.isWinner
                            ? isLucky
                              ? "text-accent-success"
                              : "text-accent-danger"
                            : "text-text-muted"
                        }`}
                      >
                        {m.isWinner
                          ? `${luckFactor.toFixed(1)}× ${isLucky ? "Glück" : "Pech"}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-lg border border-border-subtle bg-bg-card p-3">
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">
            Hashrate ≠ Garantie:
          </span>{" "}
          2× Hashrate bedeutet 2× Wahrscheinlichkeit, den nächsten Block zu
          finden — aber keine Sicherheit. Auch ein kleiner Miner kann Glück
          haben. Mining ist ein probabilistischer Wettbewerb.
        </p>
      </div>
    </div>
  );
}
