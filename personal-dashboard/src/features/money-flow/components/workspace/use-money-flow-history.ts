"use client";

import { useCallback, useRef, useState } from "react";
import type { MoneyFlowDocument } from "../../types";

const HISTORY_LIMIT = 50;

// Dormant until editor history is reintroduced as a deliberate feature.

export type MoneyFlowHistoryState = {
  canUndo: boolean;
  canRedo: boolean;
};

export function useMoneyFlowHistory() {
  const undoRef = useRef<MoneyFlowDocument[]>([]);
  const redoRef = useRef<MoneyFlowDocument[]>([]);
  const [state, setState] = useState<MoneyFlowHistoryState>({
    canUndo: false,
    canRedo: false,
  });

  const updateState = useCallback(() => {
    setState({
      canUndo: undoRef.current.length > 0,
      canRedo: redoRef.current.length > 0,
    });
  }, []);

  const push = useCallback(
    (document: MoneyFlowDocument) => {
      undoRef.current = [...undoRef.current, document].slice(-HISTORY_LIMIT);
      redoRef.current = [];
      updateState();
    },
    [updateState]
  );

  const takeUndo = useCallback(
    (current: MoneyFlowDocument) => {
      const previous = undoRef.current.at(-1);
      if (!previous) return null;

      undoRef.current = undoRef.current.slice(0, -1);
      redoRef.current = [...redoRef.current, current].slice(-HISTORY_LIMIT);
      updateState();
      return previous;
    },
    [updateState]
  );

  const takeRedo = useCallback(
    (current: MoneyFlowDocument) => {
      const next = redoRef.current.at(-1);
      if (!next) return null;

      redoRef.current = redoRef.current.slice(0, -1);
      undoRef.current = [...undoRef.current, current].slice(-HISTORY_LIMIT);
      updateState();
      return next;
    },
    [updateState]
  );

  return { state, push, takeUndo, takeRedo };
}
