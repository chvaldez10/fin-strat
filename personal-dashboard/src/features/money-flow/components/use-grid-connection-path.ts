import { Position, useStore, type InternalNode } from "@xyflow/react";
import { canvasHandleRow } from "./canvas-grid";
import { getGridConnectionPath } from "./grid-connection-path";

function nodeHandleRow(node: InternalNode | undefined, fallback: number) {
  const height = node?.measured?.height ?? node?.height ?? node?.initialHeight;
  return node && height
    ? canvasHandleRow(node.internals.positionAbsolute.y, height)
    : fallback;
}

export function useGridConnectionPath(
  options: Readonly<
    Parameters<typeof getGridConnectionPath>[0] & {
      source: string;
      target: string;
    }
  >
) {
  const { source, target, sourcePosition, targetPosition } = options;
  const horizontal =
    sourcePosition === Position.Right && targetPosition === Position.Left;
  // Match MoneyElement even when React Flow still has the previous handle bounds.
  const [sourceY, targetY] = useStore(
    ({ nodeLookup }) =>
      horizontal
        ? [
            nodeHandleRow(nodeLookup.get(source), options.sourceY),
            nodeHandleRow(nodeLookup.get(target), options.targetY),
          ]
        : [options.sourceY, options.targetY],
    (previous, next) => previous[0] === next[0] && previous[1] === next[1]
  );
  return getGridConnectionPath({ ...options, sourceY, targetY });
}
