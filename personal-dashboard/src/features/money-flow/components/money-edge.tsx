"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { formatMoney } from "../calculations";
import type { MoneyCanvasEdge } from "../canvas-types";

export const MoneyEdge = memo(function MoneyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps<MoneyCanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
    offset: 24,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 2.5 : 1.75,
          stroke: "var(--foreground)",
          opacity: selected ? 1 : 0.62,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute rounded-md border border-border bg-background px-2 py-1 text-[0.68rem] font-semibold text-foreground shadow-xs"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {data?.label ? `${data.label} · ` : ""}
          {formatMoney(data?.monthlyAmountCents ?? 0)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
