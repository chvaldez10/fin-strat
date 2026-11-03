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

export const ElementConnection = memo(function ElementConnection({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<MoneyCanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 24,
    offset: 32,
  });

  return (
    <>
      <BaseEdge
        data-testid={`money-flow-edge-${id}`}
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 1.75,
          stroke: "var(--muted-foreground)",
          opacity: 0.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute max-w-52 truncate rounded-full border border-border/70 bg-card px-3 py-1.5 text-[0.7rem] font-medium tabular-nums text-foreground shadow-sm"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
        >
          {data?.label ? `${data.label} · ` : ""}
          {formatMoney(data?.monthlyAmountCents ?? 0)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
