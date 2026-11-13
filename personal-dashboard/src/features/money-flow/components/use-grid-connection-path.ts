import { Position, useStore, type InternalNode } from "@xyflow/react";
import { canvasCardCenterY } from "./canvas-grid";
import { getGridConnectionPath } from "./grid-connection-path";

function nodeCenterY(node: InternalNode | undefined, fallback: number) {
  const height = node?.measured?.height ?? node?.height ?? node?.initialHeight;
  return node && height
    ? canvasCardCenterY(node.internals.positionAbsolute.y, height)
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
  // Match the centered side handles even when their cached bounds are stale.
  const [sourceY, targetY] = useStore(
    ({ nodeLookup }) =>
      horizontal
        ? [
            nodeCenterY(nodeLookup.get(source), options.sourceY),
            nodeCenterY(nodeLookup.get(target), options.targetY),
          ]
        : [options.sourceY, options.targetY],
    (previous, next) => previous[0] === next[0] && previous[1] === next[1]
  );
  return getGridConnectionPath({ ...options, sourceY, targetY });
}
