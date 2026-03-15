"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import type { Block, Transaction, PendingTransaction, MiningProgress, MerkleNode } from "./types";
import { GENESIS_PREV_HASH, SAMPLE_TRANSACTIONS, MINING_DIFFICULTY, NONCES_PER_FRAME } from "./constants";
import { hashTransaction, hashBlock, computeMerkleRoot, mineBlock } from "./crypto-utils";
import ChainView from "./components/ChainView";
import TransactionInput from "./components/TransactionInput";
import MineButton from "./components/MineButton";
import MerkleTreePreview from "./components/MerkleTreePreview";
import TamperDetector from "./components/TamperDetector";

async function buildGenesisBlock(): Promise<Block> {
  const txs: Transaction[] = [];
  for (let i = 0; i < 2; i++) {
    const sample = SAMPLE_TRANSACTIONS[i];
    const hash = await hashTransaction(sample);
    txs.push({ id: `genesis-tx-${i}`, from: sample.from, to: sample.to, amount: sample.amount, hash });
  }
  const txHashes = txs.map((t) => t.hash);
  const { root } = await computeMerkleRoot(txHashes);
  const header = {
    version: 1,
    prevHash: GENESIS_PREV_HASH,
    merkleRoot: root,
    timestamp: Date.now(),
    difficulty: MINING_DIFFICULTY,
    nonce: 0,
  };

  // Pre-mine genesis with a simple loop (fast for difficulty=2)
  let nonce = 0;
  let hash = await hashBlock({ ...header, nonce });
  while (!hash.startsWith("0".repeat(MINING_DIFFICULTY))) {
    nonce++;
    hash = await hashBlock({ ...header, nonce });
    if (nonce > 50000) break;
  }

  return {
    index: 0,
    header: { ...header, nonce },
    transactions: txs,
    hash,
    isValid: true,
  };
}

export default function BlockchainVisualizer() {
  const [chain, setChain] = useState<Block[]>([]);
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [mining, setMining] = useState<MiningProgress>({ isMining: false, nonce: 0, attempts: 0 });
  const [merkleTree, setMerkleTree] = useState<MerkleNode | null>(null);
  const [merkleOpen, setMerkleOpen] = useState(false);
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const rafRef = useRef<number>(0);
  const miningRef = useRef(false);
  const nonceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with genesis block
  useEffect(() => {
    buildGenesisBlock().then((genesis) => {
      setChain([genesis]);
      setIsInitialized(true);
    });
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current || !isInitialized) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-section]", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [isInitialized]);

  const addTransaction = useCallback((tx: PendingTransaction) => {
    setPendingTxs((prev) => [...prev, tx]);
  }, []);

  const clearPending = useCallback(() => {
    setPendingTxs([]);
  }, []);

  const startMining = useCallback(async () => {
    if (pendingTxs.length === 0 || chain.length === 0) return;

    // Build transactions
    const txs: Transaction[] = [];
    for (let i = 0; i < pendingTxs.length; i++) {
      const ptx = pendingTxs[i];
      const hash = await hashTransaction(ptx);
      txs.push({ id: `tx-${Date.now()}-${i}`, from: ptx.from, to: ptx.to, amount: ptx.amount, hash });
    }

    const txHashes = txs.map((t) => t.hash);
    const { root, tree } = await computeMerkleRoot(txHashes);
    setMerkleTree(tree);

    const prevBlock = chain[chain.length - 1];
    const header = {
      version: 1,
      prevHash: prevBlock.hash,
      merkleRoot: root,
      timestamp: Date.now(),
      difficulty: MINING_DIFFICULTY,
      nonce: 0,
    };

    miningRef.current = true;
    nonceRef.current = 0;
    setMining({ isMining: true, nonce: 0, attempts: 0 });

    const mineLoop = async () => {
      if (!miningRef.current) return;

      const result = await mineBlock(header, MINING_DIFFICULTY, nonceRef.current, NONCES_PER_FRAME);

      if (result.found) {
        miningRef.current = false;
        const newBlock: Block = {
          index: chain.length,
          header: { ...header, nonce: result.nonce },
          transactions: txs,
          hash: result.hash,
          isValid: true,
        };
        setChain((prev) => [...prev, newBlock]);
        setPendingTxs([]);
        setMining({ isMining: false, nonce: result.nonce, attempts: result.nonce });
        return;
      }

      nonceRef.current = result.nonce;
      setMining({ isMining: true, nonce: result.nonce, attempts: result.nonce });
      rafRef.current = requestAnimationFrame(mineLoop);
    };

    rafRef.current = requestAnimationFrame(mineLoop);
  }, [pendingTxs, chain]);

  const stopMining = useCallback(() => {
    miningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setMining({ isMining: false, nonce: 0, attempts: 0 });
  }, []);

  const tamperTransaction = useCallback(
    async (blockIndex: number, txIndex: number, newAmount: string) => {
      setTamperedBlockIndex(blockIndex);

      setChain((prev) => {
        const newChain = prev.map((b) => ({
          ...b,
          header: { ...b.header },
          transactions: b.transactions.map((t) => ({ ...t })),
        }));

        // Modify the transaction
        const block = newChain[blockIndex];
        block.transactions[txIndex] = { ...block.transactions[txIndex], amount: newAmount };

        // Recalculate from tampered block onward
        const recalculate = async () => {
          // Recalc tampered block's merkle root & hash
          const txHashes: string[] = [];
          for (const tx of block.transactions) {
            const h = await hashTransaction(tx);
            tx.hash = h;
            txHashes.push(h);
          }
          const { root } = await computeMerkleRoot(txHashes);
          block.header.merkleRoot = root;
          block.hash = await hashBlock(block.header);
          block.isValid = false;

          // Cascade: all subsequent blocks become invalid
          for (let i = blockIndex + 1; i < newChain.length; i++) {
            newChain[i].isValid = false;
          }

          setChain([...newChain]);
        };

        recalculate();
        return newChain;
      });
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      miningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        <span className="ml-3 font-code text-sm text-text-muted">Genesis-Block wird erzeugt...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Chain View */}
      <div data-section>
        <h3 className="mb-3 font-display text-sm font-semibold text-text-primary">
          Blockchain ({chain.length} Block{chain.length !== 1 ? "s" : ""})
        </h3>
        <ChainView chain={chain} onTamperTransaction={tamperTransaction} />
      </div>

      {/* Tamper Detection */}
      <div data-section>
        <TamperDetector chain={chain} tamperedBlockIndex={tamperedBlockIndex} />
      </div>

      {/* Controls */}
      <div data-section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionInput
          pendingTxs={pendingTxs}
          onAddTransaction={addTransaction}
          onClearPending={clearPending}
          disabled={mining.isMining}
        />
        <div className="space-y-4">
          <MineButton
            onMine={startMining}
            onStop={stopMining}
            mining={mining}
            hasPendingTxs={pendingTxs.length > 0}
          />
        </div>
      </div>

      {/* Merkle Tree */}
      {merkleTree && (
        <div data-section>
          <MerkleTreePreview
            tree={merkleTree}
            isOpen={merkleOpen}
            onToggle={() => setMerkleOpen(!merkleOpen)}
          />
        </div>
      )}

      {/* Info Box */}
      <div data-section className="rounded-lg border border-border-subtle bg-bg-card p-4">
        <h4 className="mb-2 font-display text-sm font-semibold text-text-primary">
          So funktioniert es
        </h4>
        <ul className="space-y-1.5 text-xs leading-relaxed text-text-secondary">
          <li>
            <span className="font-semibold text-accent-primary">Blöcke</span> enthalten Transaktionen und einen Header mit dem Hash des vorherigen Blocks.
          </li>
          <li>
            <span className="font-semibold text-accent-success">Merkle Root</span> fasst alle Transaktions-Hashes in einem einzigen Hash zusammen.
          </li>
          <li>
            <span className="font-semibold text-accent-warning">Mining</span> findet eine Nonce, sodass der Block-Hash mit der geforderten Anzahl Nullen beginnt.
          </li>
          <li>
            <span className="font-semibold text-accent-danger">Manipulation</span>: Klicke auf einen Betrag, um ihn zu ändern — beobachte, wie die Kette bricht.
          </li>
        </ul>
      </div>
    </div>
  );
}
