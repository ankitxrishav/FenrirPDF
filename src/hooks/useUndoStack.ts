import { useState, useCallback } from "react";

/**
 * Reusable hook to manage a stack of state snapshots for undo support.
 */
export function useUndoStack<T>(maxDepth = 10) {
  const [history, setHistory] = useState<T[]>([]);

  const pushState = useCallback((state: T) => {
    // Stringify and parse to deep copy simple objects/arrays
    const snapshot = JSON.parse(JSON.stringify(state));
    setHistory((prev) => {
      const nextHistory = [...prev, snapshot];
      if (nextHistory.length > maxDepth) {
        return nextHistory.slice(nextHistory.length - maxDepth);
      }
      return nextHistory;
    });
  }, [maxDepth]);

  const popState = useCallback(() => {
    let popped: T | null = null;
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const nextHistory = [...prev];
      popped = nextHistory.pop()!;
      return nextHistory;
    });
    return popped;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    pushState,
    popState,
    canUndo: history.length > 0,
    clearHistory,
  };
}
