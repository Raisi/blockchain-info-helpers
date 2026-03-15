"use client";

import { useState, useEffect } from "react";
import { sha256, hexToBinary, computeBitDiff } from "../crypto-utils";
import { DEFAULT_INPUT, DEFAULT_INPUT_B } from "../constants";
import BitGrid from "./BitGrid";
import HexBreakdown from "./HexBreakdown";

export default function AvalancheCompare() {
  const [inputA, setInputA] = useState(DEFAULT_INPUT);
  const [inputB, setInputB] = useState(DEFAULT_INPUT_B);
  const [hexA, setHexA] = useState("");
  const [hexB, setHexB] = useState("");

  useEffect(() => {
    sha256(inputA).then(setHexA);
  }, [inputA]);

  useEffect(() => {
    sha256(inputB).then(setHexB);
  }, [inputB]);

  const binaryA = hexA ? hexToBinary(hexA) : "";
  const binaryB = hexB ? hexToBinary(hexB) : "";
  const { diffs, changedCount } = binaryA && binaryB
    ? computeBitDiff(binaryA, binaryB)
    : { diffs: undefined, changedCount: 0 };

  const percentage = diffs ? ((changedCount / 256) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block font-display text-sm font-medium text-text-primary">
            Eingabe A
          </label>
          <input
            type="text"
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3 font-code text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30"
          />
        </div>
        <div>
          <label className="mb-2 block font-display text-sm font-medium text-text-primary">
            Eingabe B
          </label>
          <input
            type="text"
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-bg-primary/50 p-3 font-code text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30"
          />
        </div>
      </div>

      {diffs && (
        <div className="rounded-lg border border-accent-warning/30 bg-accent-warning/5 p-3">
          <p className="font-display text-sm font-medium text-accent-warning">
            {changedCount} von 256 Bits unterschiedlich ({percentage}%)
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Ideal wären ~50% — SHA-256 verteilt Änderungen gleichmäßig über den gesamten Hash.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <HexBreakdown hex={hexA} label="Hash A" animate={false} />
          <BitGrid binary={binaryA} label="Bits A" />
        </div>
        <div className="space-y-3">
          <HexBreakdown hex={hexB} label="Hash B" animate={false} />
          <BitGrid binary={binaryB} diffs={diffs} label="Bits B (Unterschiede rot)" />
        </div>
      </div>
    </div>
  );
}
