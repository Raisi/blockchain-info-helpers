"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import type { MerkleNode } from "../types";

interface MerkleTreePreviewProps {
  tree: MerkleNode | null;
  isOpen: boolean;
  onToggle: () => void;
}

function collectLevels(node: MerkleNode): MerkleNode[][] {
  const levels: MerkleNode[][] = [];
  let current = [node];

  while (current.length > 0) {
    levels.push(current);
    const next: MerkleNode[] = [];
    for (const n of current) {
      if (n.left) next.push(n.left);
      if (n.right && n.right !== n.left) next.push(n.right);
    }
    current = next;
  }

  return levels;
}

export default function MerkleTreePreview({ tree, isOpen, onToggle }: MerkleTreePreviewProps) {
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !treeRef.current) return;
    const ctx = gsap.context(() => {
      const nodes = treeRef.current?.querySelectorAll("[data-merkle-node]");
      if (!nodes) return;
      gsap.from(nodes, {
        opacity: 0,
        y: 10,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
      });
    }, treeRef);
    return () => ctx.revert();
  }, [isOpen, tree]);

  if (!tree) return null;

  const levels = collectLevels(tree);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between"
      >
        <h4 className="font-display text-sm font-semibold text-text-primary">
          Merkle Tree
        </h4>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div ref={treeRef} className="mt-4 space-y-3">
          {levels.map((level, li) => (
            <div key={li} className="flex items-center justify-center gap-2">
              {level.map((node, ni) => (
                <div
                  key={ni}
                  data-merkle-node
                  className={`rounded-lg border px-2 py-1 font-code text-[10px] ${
                    node.isLeaf
                      ? "border-accent-primary/30 bg-accent-primary/5 text-accent-primary"
                      : li === 0
                        ? "border-accent-success/30 bg-accent-success/5 text-accent-success"
                        : "border-accent-secondary/30 bg-accent-secondary/5 text-accent-secondary"
                  }`}
                >
                  {node.isLeaf && node.txId && (
                    <span className="mr-1 text-text-muted">{node.txId}: </span>
                  )}
                  {li === 0 && !node.isLeaf && (
                    <span className="mr-1 text-text-muted">Root: </span>
                  )}
                  {node.hash.slice(0, 12)}...
                </div>
              ))}
            </div>
          ))}

          <p className="text-center font-code text-[10px] text-text-muted">
            ↑ Leaf-Hashes → paarweise gehasht → Merkle Root
          </p>
        </div>
      )}
    </div>
  );
}
