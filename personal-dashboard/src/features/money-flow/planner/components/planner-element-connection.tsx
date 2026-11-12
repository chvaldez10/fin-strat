"use client";
import { EdgeLabelRenderer, type Edge, type EdgeProps } from "@xyflow/react";
import { formatMoney } from "../../calculations";
import { ElementConnectionPath } from "../../components/element-connection-path";
import { ELEMENT_PRESENTATION } from "../../components/element-presentation";
import { useGridConnectionPath } from "../../components/use-grid-connection-path";
import type { MoneyNodeKind } from "../../types";
export type PlannerEdge = Edge<
  { amount: number | null; kind: MoneyNodeKind; hideLabel?: boolean },
  "planner"
>;
export function PlannerElementConnection(
  props: Readonly<EdgeProps<PlannerEdge>>
) {
  const [path, x, y] = useGridConnectionPath({ ...props, borderRadius: 20 });
  return (
    <>
      <ElementConnectionPath
        color={ELEMENT_PRESENTATION[props.data?.kind ?? "chequing"].connection}
        id={props.id}
        data-testid={`money-flow-edge-${props.id}`}
        path={path}
      />
      {!props.data?.hideLabel && (
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
      )}
    </>
  );
}
