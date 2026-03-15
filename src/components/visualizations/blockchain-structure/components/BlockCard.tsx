"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { Block } from "../types";
import { BLOCK_FIELD_COLORS } from "../constants";

interface BlockCardProps {
  block: Block;
  onTamperTransaction: (blockIndex: number, txIndex: number, newAmount: string) => void;
  isLatest?: boolean;
}

export default function BlockCard({ block, onTamperTransaction, isLatest }: BlockCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [editingTx, setEditingTx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      if (isLatest) {
        gsap.from(cardRef.current, {
          x: 60,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, [isLatest]);

  useEffect(() => {
    if (!cardRef.current || block.isValid) return;
    gsap.from(cardRef.current, {
      borderColor: "rgba(239, 68, 68, 0.8)",
      duration: 0.3,
      ease: "power2.out",
    });
  }, [block.isValid, block.hash]);

  const startEdit = (txIndex: number, currentAmount: string) => {
    setEditingTx(txIndex);
    setEditValue(currentAmount);
  };

  const submitEdit = (txIndex: number) => {
    if (editValue.trim()) {
      onTamperTransaction(block.index, txIndex, editValue.trim());
    }
    setEditingTx(null);
  };

  return (
    <div
      ref={cardRef}
      className={`w-72 shrink-0 rounded-xl border-2 p-4 transition-colors ${
        block.isValid
          ? "border-border-subtle bg-bg-card"
          : "border-accent-danger/50 bg-accent-danger/5"
      }`}
    >
      {/* Block Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-text-primary">
          Block #{block.index}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 font-code text-[10px] font-semibold ${
            block.isValid
              ? "bg-accent-success/15 text-accent-success"
              : "bg-accent-danger/15 text-accent-danger"
          }`}
        >
          {block.isValid ? "Gültig" : "Ungültig"}
        </span>
      </div>

      {/* Header Fields */}
      <div className="mb-3 space-y-1.5">
        {BLOCK_FIELD_COLORS.map(({ field, label, color }) => {
          const value = block.header[field as keyof typeof block.header];
          const displayValue =
            typeof value === "string"
              ? value.slice(0, 10) + "..."
              : String(value);

          return (
            <div key={field} className="flex items-center justify-between gap-2">
              <span className={`font-code text-[10px] text-${color}`}>{label}</span>
              <span className="truncate font-code text-[10px] text-text-muted">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hash */}
      <div className="mb-3 rounded-lg bg-bg-primary/50 p-2">
        <p className="mb-1 font-code text-[10px] text-text-muted">Block Hash</p>
        <p className="break-all font-code text-[10px] text-accent-primary">
          {block.hash.slice(0, 16)}...
        </p>
      </div>

      {/* Transactions */}
      <div>
        <p className="mb-1.5 font-code text-[10px] font-semibold text-text-secondary">
          Transaktionen ({block.transactions.length})
        </p>
        <div className="space-y-1">
          {block.transactions.map((tx, txIdx) => (
            <div
              key={tx.id}
              className="group flex items-center justify-between rounded bg-bg-secondary/50 px-2 py-1"
            >
              <span className="font-code text-[10px] text-text-secondary">
                {tx.from} → {tx.to}
              </span>
              {editingTx === txIdx ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => submitEdit(txIdx)}
                  onKeyDown={(e) => e.key === "Enter" && submitEdit(txIdx)}
                  autoFocus
                  className="w-20 rounded border border-accent-warning bg-bg-primary px-1 font-code text-[10px] text-accent-warning focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => startEdit(txIdx, tx.amount)}
                  className="font-code text-[10px] text-accent-primary transition-colors hover:text-accent-warning"
                  title="Klicken zum Manipulieren"
                >
                  {tx.amount}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
