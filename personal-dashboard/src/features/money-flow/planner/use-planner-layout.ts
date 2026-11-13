"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ReactFlowInstance, Viewport } from "@xyflow/react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { MoneyCanvasNode } from "../canvas-types";
import type { MoneyFlowPlan } from "../persistence/convex-types";
import type { WorkspaceWriteAccess } from "../persistence/workspace-write-access";
import { withWorkspaceAccess } from "../persistence/workspace-write-access";
import { SaveQueue } from "../persistence/save-queue";
import type { FinancialAccount } from "./types";
import type { PlannerEdge } from "./components/planner-element-connection";

export type PlannerLayout = NonNullable<
  FunctionReturnType<typeof api.plannerCanvas.get>
>["layout"];
export type PlannerLayoutValues = {
  positions: Record<string, { x: number; y: number }>;
  viewport: Viewport;
};
export type CanvasPlacement = (positions: PlannerLayoutValues["positions"]) => {
  x: number;
  y: number;
};
const CAMERA_SAVE_DELAY_MS = 1000;

/** Camera gestures stay local until idle; element moves still save immediately. */
export function usePlannerLayout({
  account,
  scope,
  root,
  layout,
  access,
  instance,
  viewportToSave,
  layoutNamespace = "",
}: Readonly<{
  account: FinancialAccount;
  scope?: "activity";
  root: MoneyFlowPlan;
  layout: PlannerLayout;
  access: WorkspaceWriteAccess;
  instance: RefObject<ReactFlowInstance<MoneyCanvasNode, PlannerEdge> | null>;
  viewportToSave?: (current: Viewport) => Viewport;
  layoutNamespace?: string;
}>) {
  const save = useMutation(api.plannerCanvas.saveLayout);
  const [positions, setPositions] = useState(layout?.positions ?? {});
  const [loaded] = useState<PlannerLayoutValues>(() => ({
    positions: layout?.positions ?? {},
    viewport: layout?.viewport ?? { x: 0, y: 0, zoom: 0.8 },
  }));
  const knownPositions = useRef(loaded.positions);
  const pending = useRef<PlannerLayoutValues | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueued = useRef(JSON.stringify(loaded));
  const mounted = useRef(false);
  const [queue] = useState(
    () =>
      new SaveQueue<PlannerLayoutValues>(
        layout?.revision ?? 0,
        (values, revision) =>
          withWorkspaceAccess(access, () =>
            save({
              documentId: root._id,
              accountId: account.legacyAccountId!,
              scope,
              sessionId: access.sessionId,
              expectedRevision: revision,
              values,
            })
          )
      )
  );
  const canWrite = access.canWrite;
  const cancelTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const flushPending = useCallback(() => {
    cancelTimer();
    const values = pending.current;
    pending.current = null;
    if (!values || !canWrite()) return;
    const fingerprint = JSON.stringify(values);
    if (fingerprint === lastQueued.current) return;
    lastQueued.current = fingerprint;
    queue.enqueue(values);
  }, [cancelTimer, canWrite, queue]);
  const readLayout = useCallback((): PlannerLayoutValues | null => {
    const flow = instance.current;
    if (!flow || !canWrite()) return null;
    knownPositions.current = {
      ...knownPositions.current,
      ...Object.fromEntries(
        flow.getNodes().flatMap((node) => {
          const id = layoutNamespace + node.id;
          // Monthly income cards use automatic positions until moved.
          return scope === "activity" &&
            node.data.kind === "income" &&
            !knownPositions.current[id]
            ? []
            : [[id, node.position]];
        })
      ),
    };
    const currentViewport = flow.getViewport();
    const viewport = viewportToSave?.(currentViewport) ?? currentViewport;
    return {
      positions: knownPositions.current,
      viewport: {
        x: Math.round(viewport.x * 100) / 100,
        y: Math.round(viewport.y * 100) / 100,
        zoom: Math.round(viewport.zoom * 10000) / 10000,
      },
    };
  }, [canWrite, instance, layoutNamespace, scope, viewportToSave]);
  const captureViewport = useCallback(() => {
    pending.current = readLayout();
    cancelTimer();
    if (pending.current)
      timer.current = setTimeout(flushPending, CAMERA_SAVE_DELAY_MS);
  }, [readLayout, cancelTimer, flushPending]);
  const moveElement = useCallback(
    (node: Pick<MoneyCanvasNode, "id" | "position">) => {
      knownPositions.current = {
        ...knownPositions.current,
        [node.id]: node.position,
      };
      setPositions(knownPositions.current);
      pending.current = readLayout();
      flushPending();
    },
    [readLayout, flushPending]
  );
  const placeElement = useCallback(
    (id: string, positionFor: CanvasPlacement) => {
      const layout = readLayout();
      if (!layout || layout.positions[id]) return false;
      const positions = {
        ...layout.positions,
        [id]: positionFor(layout.positions),
      };
      knownPositions.current = positions;
      setPositions(positions);
      pending.current = { ...layout, positions };
      flushPending();
      return true;
    },
    [readLayout, flushPending]
  );
  const removePlacement = useCallback(
    (id: string) => {
      const layout = readLayout();
      if (!layout?.positions[id]) return;
      const positions = { ...layout.positions };
      delete positions[id];
      knownPositions.current = positions;
      setPositions(positions);
      pending.current = { ...layout, positions };
      flushPending();
    },
    [readLayout, flushPending]
  );
  const restorePositions = useCallback(
    async (fit = false) => {
      const flow = instance.current;
      if (!flow || !canWrite()) return;
      cancelTimer();
      const restored = Object.fromEntries(
        Object.entries(knownPositions.current).map(([id, position]) => [
          id,
          loaded.positions[id] ?? position,
        ])
      );
      knownPositions.current = restored;
      flow.setNodes((current) =>
        current.map((node) => ({
          ...node,
          position: restored[layoutNamespace + node.id] ?? node.position,
        }))
      );
      setPositions(restored);
      if (fit) await flow.fitView({ padding: 0.2 });
      else await flow.setViewport(loaded.viewport);
      requestAnimationFrame(() => {
        if (!mounted.current || !canWrite()) return;
        pending.current = readLayout();
        flushPending();
      });
    },
    [
      instance,
      canWrite,
      cancelTimer,
      loaded,
      readLayout,
      flushPending,
      layoutNamespace,
    ]
  );
  useEffect(() => {
    mounted.current = true;
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushPending();
    };
    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", flushPending);
      document.removeEventListener("visibilitychange", onHidden);
      flushPending();
    };
  }, [flushPending]);
  const retry = useCallback(() => {
    flushPending();
    return queue.retry();
  }, [flushPending, queue]);
  return {
    positions,
    queue,
    moveElement,
    placeElement,
    removePlacement,
    captureViewport,
    cancelTimer,
    restorePositions,
    retry,
  };
}
