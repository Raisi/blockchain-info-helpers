"use client";

import { useRef, useCallback, useEffect } from "react";
import type { HashBatchResult } from "../../../types";

interface UseHashWorkerOptions {
  onBatchResult: (result: HashBatchResult) => void;
}

export interface HashWorkerHandle {
  start: (difficulty: number) => void;
  stop: () => void;
  isRunning: boolean;
}

export function useHashWorker({
  onBatchResult,
}: UseHashWorkerOptions): HashWorkerHandle {
  const workerRef = useRef<Worker | null>(null);
  const isRunningRef = useRef(false);
  const callbackRef = useRef(onBatchResult);
  callbackRef.current = onBatchResult;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      isRunningRef.current = false;
    };
  }, []);

  const start = useCallback((difficulty: number) => {
    // Terminate existing worker
    workerRef.current?.terminate();

    const worker = new Worker(
      new URL("../worker/mining.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<HashBatchResult>) => {
      callbackRef.current(e.data);

      // If found, stop
      if (e.data.foundNonce !== null) {
        isRunningRef.current = false;
        return;
      }

      // Request next batch
      if (isRunningRef.current) {
        worker.postMessage({
          type: "MINE_BATCH",
          startNonce: e.data.endNonce,
          batchSize: 500,
          difficulty,
        });
      }
    };

    workerRef.current = worker;
    isRunningRef.current = true;

    // Kick off first batch
    worker.postMessage({
      type: "MINE_BATCH",
      startNonce: 0,
      batchSize: 500,
      difficulty,
    });
  }, []);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  return {
    start,
    stop,
    get isRunning() {
      return isRunningRef.current;
    },
  };
}
