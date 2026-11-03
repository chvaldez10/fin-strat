import { MarkerType } from "@xyflow/react";

export function canvasMotionDuration(duration: number) {
  return document.documentElement.hasAttribute("data-reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : duration;
}

export const SNAP_GRID: [number, number] = [24, 24];
export const DEFAULT_EDGE_OPTIONS = {
  type: "money",
  selectable: false,
  focusable: false,
  deletable: false,
  reconnectable: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "var(--muted-foreground)",
  },
};
