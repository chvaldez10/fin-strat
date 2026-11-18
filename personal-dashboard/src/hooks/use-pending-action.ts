"use client";

import { useRef, useState } from "react";

/** Ignore overlapping calls and expose pending state for the owning UI. */
export function usePendingAction() {
  const running = useRef(false);
  const [pending, setPending] = useState(false);

  async function run(work: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setPending(true);
    try {
      await work();
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return { pending, run };
}
