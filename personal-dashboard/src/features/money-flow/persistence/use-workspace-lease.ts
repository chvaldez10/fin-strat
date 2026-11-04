"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { MoneyFlowPlan } from "./convex-types";

type Grant = Extract<
  FunctionReturnType<typeof api.moneyFlowSessions.acquire>,
  { status: "active" }
>;
export type WorkspaceLeaseStatus =
  "checking" | "active" | "blocked" | "displaced" | "expired" | "error";
type Session = {
  sessionId: string;
  claim: Promise<FunctionReturnType<typeof api.moneyFlowSessions.acquire>>;
  startedAt: number;
  deadline: number;
  active: boolean;
};
let reloadClaimed = false;

/** One attempt per mounted route. Only an actual document reload can take over. */
export function useWorkspaceLease(root: MoneyFlowPlan, accountId: string) {
  const acquire = useMutation(api.moneyFlowSessions.acquire);
  const renew = useMutation(api.moneyFlowSessions.renew);
  const release = useMutation(api.moneyFlowSessions.release);
  const current = useQuery(api.moneyFlowSessions.current, {
    documentId: root._id,
    accountId,
  });
  const session = useRef<Session | null>(null);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<{
    status: WorkspaceLeaseStatus;
    grant: Grant | null;
    sessionId: string | null;
  }>({ status: "checking", grant: null, sessionId: null });

  const block = useCallback((status: WorkspaceLeaseStatus = "displaced") => {
    if (session.current) session.current.active = false;
    setState((value) => ({ ...value, status }));
  }, []);
  const canWrite = useCallback(() => {
    const value = session.current;
    return !!value?.active && value.deadline > performance.now();
  }, []);
  const onLost = useCallback(() => block("displaced"), [block]);

  useEffect(() => {
    if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
    const canvas = { documentId: root._id, accountId };
    if (!session.current) {
      const sessionId = crypto.randomUUID();
      const navigation = performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined;
      const takeover =
        !reloadClaimed &&
        navigation?.type === "reload" &&
        new URL(navigation.name).pathname === window.location.pathname;
      reloadClaimed = true;
      session.current = {
        sessionId,
        startedAt: performance.now(),
        deadline: 0,
        active: false,
        claim: acquire({
          ...canvas,
          sessionId,
          takeover,
        }),
      };
    }
    const value = session.current;
    let stopped = false;
    let renewing = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let expiry: ReturnType<typeof setInterval> | undefined;

    function acceptDeadline(
      result: { expiresAt: number; serverTime: number },
      startedAt: number
    ) {
      // Monotonic local time avoids device-clock differences. Subtract the full
      // round trip so the browser always stops before the server lease expires.
      value.deadline = startedAt + result.expiresAt - result.serverTime;
    }
    async function pulse() {
      if (stopped || renewing || !value.active) return;
      if (value.deadline <= performance.now()) {
        block("expired");
        return;
      }
      renewing = true;
      const startedAt = performance.now();
      try {
        const result = await renew({ ...canvas, sessionId: value.sessionId });
        if (stopped || !value.active) return;
        if (result.status === "blocked") block("displaced");
        else acceptDeadline(result, startedAt);
      } catch {
        if (!stopped) block("error");
      } finally {
        renewing = false;
      }
    }
    const resume = () => {
      if (document.visibilityState === "visible") void pulse();
    };
    void value.claim.then(
      (result) => {
        if (stopped) return;
        if (result.status === "blocked") {
          block("blocked");
          return;
        }
        acceptDeadline(result, value.startedAt);
        if (value.deadline <= performance.now()) {
          block("expired");
          return;
        }
        value.active = true;
        setState({
          status: "active",
          grant: result,
          sessionId: value.sessionId,
        });
        heartbeat = setInterval(() => void pulse(), 20_000);
        expiry = setInterval(() => {
          if (value.active && value.deadline <= performance.now())
            block("expired");
        }, 1_000);
      },
      () => {
        if (!stopped) block("error");
      }
    );
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    return () => {
      stopped = true;
      clearInterval(heartbeat);
      clearInterval(expiry);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      // Defer cleanup so React Strict Mode's effect replay reuses the same
      // claim instead of releasing/reacquiring (or stealing control twice).
      cleanupTimer.current = setTimeout(() => {
        value.active = false;
        void value.claim
          .then((result) =>
            result.status === "active"
              ? release({ ...canvas, sessionId: value.sessionId })
              : null
          )
          .catch(() => {}); // A closed/offline browser is covered by expiry.
      }, 0);
    };
  }, [root._id, accountId, acquire, renew, release, block]);

  const displaced = !!(
    state.grant &&
    current &&
    (current.generation > state.grant.generation ||
      (current.generation === state.grant.generation &&
        current.sessionId !== state.sessionId))
  );
  useEffect(() => {
    if (displaced && session.current) session.current.active = false;
  }, [displaced]);

  return {
    ...state,
    status: displaced ? ("displaced" as const) : state.status,
    canWrite,
    onLost,
  };
}
