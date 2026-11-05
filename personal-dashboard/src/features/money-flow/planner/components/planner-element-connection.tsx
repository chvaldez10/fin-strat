"use client";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { formatMoney } from "../../calculations";
export type PlannerEdge = Edge<{ amount: number | null }, "planner">;
export function PlannerElementConnection(
  props: Readonly<EdgeProps<PlannerEdge>>
) {
  const [path, x, y] = getSmoothStepPath({ ...props, borderRadius: 20 });
  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={props.markerEnd}
        style={{
          stroke: "var(--muted-foreground)",
          strokeWidth: 1.5,
          opacity: 0.5,
        }}
      />
      <EdgeLabelRenderer>
        <span
          className="pointer-events-none absolute rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground"
          style={{
            transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          }}
        >
          {props.data?.amount === null
            ? "Not confirmed"
            : formatMoney(props.data?.amount ?? 0)}
        </span>
      </EdgeLabelRenderer>
    </>
  );
}
