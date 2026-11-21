import { Background, BackgroundVariant } from "@xyflow/react";
import { CANVAS_GRID_SIZE } from "./canvas-grid";

export function CanvasGridBackground({
  variant = BackgroundVariant.Lines,
}: Readonly<{ variant?: BackgroundVariant }>) {
  return (
    <Background
      variant={variant}
      gap={CANVAS_GRID_SIZE}
      size={1.25}
      lineWidth={1}
      color="color-mix(in oklab, var(--foreground) 20%, transparent)"
    />
  );
}
