"use client";

import { useState } from "react";
import type { PendingTransaction } from "../types";

interface TransactionInputProps {
  pendingTxs: PendingTransaction[];
  onAddTransaction: (tx: PendingTransaction) => void;
  onClearPending: () => void;
  disabled?: boolean;
}

export default function TransactionInput({
  pendingTxs,
  onAddTransaction,
  onClearPending,
  disabled,
}: TransactionInputProps) {
  const [from, setFrom] = useState("Alice");
  const [to, setTo] = useState("Bob");
  const [amount, setAmount] = useState("0.5 BTC");

  const handleAdd = () => {
    if (!from.trim() || !to.trim() || !amount.trim()) return;
    onAddTransaction({ from: from.trim(), to: to.trim(), amount: amount.trim() });
    setAmount("");
  };

  return (
    <div className="space-y-3">
      <h4 className="font-display text-sm font-semibold text-text-primary">
        Neue Transaktion
      </h4>

      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Von"
          disabled={disabled}
          className="rounded-lg border border-border-subtle bg-bg-primary/50 px-2 py-1.5 font-code text-xs text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none disabled:opacity-50"
        />
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="An"
          disabled={disabled}
          className="rounded-lg border border-border-subtle bg-bg-primary/50 px-2 py-1.5 font-code text-xs text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none disabled:opacity-50"
        />
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Betrag"
          disabled={disabled}
          className="rounded-lg border border-border-subtle bg-bg-primary/50 px-2 py-1.5 font-code text-xs text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={disabled || !from.trim() || !to.trim() || !amount.trim()}
        className="rounded-lg bg-accent-primary/15 px-4 py-1.5 font-display text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/25 disabled:opacity-50"
      >
        + Transaktion hinzufügen
      </button>

      {pendingTxs.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-code text-xs text-text-muted">
              Ausstehend: {pendingTxs.length} Transaktion{pendingTxs.length > 1 ? "en" : ""}
            </p>
            <button
              onClick={onClearPending}
              className="font-code text-[10px] text-text-muted hover:text-accent-danger"
            >
              Leeren
            </button>
          </div>
          {pendingTxs.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded bg-accent-warning/5 px-2 py-1 text-[10px]"
            >
              <span className="font-code text-text-secondary">
                {tx.from} → {tx.to}
              </span>
              <span className="font-code text-accent-warning">{tx.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
