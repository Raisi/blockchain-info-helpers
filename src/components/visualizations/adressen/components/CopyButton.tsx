"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
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
