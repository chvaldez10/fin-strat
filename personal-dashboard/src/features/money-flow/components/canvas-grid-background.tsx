import { Background, BackgroundVariant } from "@xyflow/react";
import { CANVAS_GRID_SIZE } from "./canvas-grid";

export function CanvasGridBackground() {
  return (
    <Background
      variant={BackgroundVariant.Lines}
      gap={CANVAS_GRID_SIZE}
      lineWidth={1}
      color="color-mix(in oklab, var(--foreground) 20%, transparent)"
    />
  );
}
