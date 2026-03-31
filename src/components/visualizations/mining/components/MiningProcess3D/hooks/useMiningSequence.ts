"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { MiningStage, MiningSequenceState } from "../../../types";

const STAGE_ORDER: MiningStage[] = [
  "idle",
  "mempool",
  "assembly",
  "header",
  "nonce-search",
  "found",
  "chain-connect",
  "complete",
];

type Action =
  | { type: "START" }
  | { type: "NEXT_STAGE" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "TOGGLE_PAUSE" }
  | { type: "UPDATE_NONCE"; nonce: number; hashAttempts: number; lastHash: string | null }
  | { type: "FOUND"; hash: string; nonce: number }
  | { type: "UPDATE_ELAPSED"; elapsed: number }
  | { type: "RESET" };

const initialState: MiningSequenceState = {
  stage: "idle",
  progress: 0,
  speed: 1,
  paused: false,
  nonce: 0,
  hashAttempts: 0,
  foundHash: null,
  lastHash: null,
  startTime: null,
  elapsed: 0,
};

function reducer(
  state: MiningSequenceState,
  action: Action
): MiningSequenceState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        stage: "mempool",
        progress: 0,
        paused: false,
        startTime: Date.now(),
        nonce: 0,
        hashAttempts: 0,
        foundHash: null,
        lastHash: null,
        elapsed: 0,
      };
    case "NEXT_STAGE": {
      if (state.paused) return state;
      const currentIndex = STAGE_ORDER.indexOf(state.stage);
      const nextStage =
        currentIndex < STAGE_ORDER.length - 1
          ? STAGE_ORDER[currentIndex + 1]
          : state.stage;
      return { ...state, stage: nextStage, progress: 0 };
    }
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "TOGGLE_PAUSE":
      return { ...state, paused: !state.paused };
    case "UPDATE_NONCE":
      return {
        ...state,
        nonce: action.nonce,
        hashAttempts: action.hashAttempts,
        lastHash: action.lastHash,
      };
    case "FOUND":
      return {
        ...state,
        stage: "found",
        foundHash: action.hash,
        lastHash: action.hash,
        nonce: action.nonce,
        progress: 0,
      };
    case "UPDATE_ELAPSED":
      return { ...state, elapsed: action.elapsed };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useMiningSequence() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const nextStage = useCallback(() => dispatch({ type: "NEXT_STAGE" }), []);
  const setSpeed = useCallback(
    (speed: number) => dispatch({ type: "SET_SPEED", speed }),
    []
  );
  const togglePause = useCallback(
    () => dispatch({ type: "TOGGLE_PAUSE" }),
    []
  );
  const updateNonce = useCallback(
    (nonce: number, hashAttempts: number, lastHash: string | null) =>
      dispatch({ type: "UPDATE_NONCE", nonce, hashAttempts, lastHash }),
    []
  );
  const found = useCallback(
    (hash: string, nonce: number) =>
      dispatch({ type: "FOUND", hash, nonce }),
    []
  );
  const updateElapsed = useCallback(
    (elapsed: number) => dispatch({ type: "UPDATE_ELAPSED", elapsed }),
    []
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    stateRef,
    start,
    nextStage,
    setSpeed,
    togglePause,
    updateNonce,
    found,
    updateElapsed,
    reset,
  };
}
