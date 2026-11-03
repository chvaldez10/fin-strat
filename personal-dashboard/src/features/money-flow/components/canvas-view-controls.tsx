"use client";

import { useViewport } from "@xyflow/react";
import { Focus, Grid2X2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasToolButton } from "./canvas-tool-button";

export function CanvasViewControls({
  onFitView,
  onZoomIn,
  onZoomOut,
  onReset,
  inspectorOpen,
  gridVisible,
  onToggleGrid,
}: {
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  inspectorOpen: boolean;
  gridVisible: boolean;
  onToggleGrid: () => void;
}) {
  const { zoom } = useViewport();
  return (
    <section
      aria-label="Canvas view"
      className={cn(
        "absolute right-4 top-4 z-20 flex max-w-[calc(100%-2rem)] items-center gap-0.5 overflow-x-auto rounded-2xl border border-border/70 bg-card/95 p-1 text-card-foreground shadow-sm backdrop-blur md:bottom-5 md:left-5 md:right-auto md:top-auto",
        inspectorOpen && "max-md:hidden"
      )}
    >
      <CanvasToolButton label="Zoom out" onClick={onZoomOut}>
        <Minus />
      </CanvasToolButton>
      <output
        aria-label="Canvas zoom"
        className="min-w-11 text-center text-xs font-medium tabular-nums text-muted-foreground"
      >
        {Math.round(zoom * 100)}%
      </output>
      <CanvasToolButton label="Zoom in" onClick={onZoomIn}>
        <Plus />
      </CanvasToolButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <CanvasToolButton
        label={gridVisible ? "Hide grid" : "Show grid"}
        aria-pressed={gridVisible}
        variant={gridVisible ? "secondary" : "ghost"}
        onClick={onToggleGrid}
      >
        <Grid2X2 />
      </CanvasToolButton>
      <CanvasToolButton label="Fit view" onClick={onFitView}>
        <Focus />
      </CanvasToolButton>
      <CanvasToolButton label="Restore loaded version" onClick={onReset}>
        <RotateCcw />
      </CanvasToolButton>
    </section>
  );
}
