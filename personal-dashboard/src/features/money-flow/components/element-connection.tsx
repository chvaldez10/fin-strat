"use client";

import { memo } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useNodesData,
  type EdgeProps,
} from "@xyflow/react";
import { formatMoney } from "../calculations";
import type { MoneyCanvasEdge, MoneyCanvasNode } from "../canvas-types";
import { ElementConnectionPath } from "./element-connection-path";
import { ELEMENT_PRESENTATION } from "./element-presentation";

export const ElementConnection = memo(function ElementConnection({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: Readonly<EdgeProps<MoneyCanvasEdge>>) {
  const connected = useNodesData<MoneyCanvasNode>([source, target]);
  const sourceKind = connected.find((node) => node.id === source)?.data.kind;
  const targetKind = connected.find((node) => node.id === target)?.data.kind;
  const kind = sourceKind === "income" ? "income" : (targetKind ?? "chequing");
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
      <ElementConnectionPath
        color={ELEMENT_PRESENTATION[kind].connection}
        data-testid={`money-flow-edge-${id}`}
        id={id}
        path={edgePath}
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
