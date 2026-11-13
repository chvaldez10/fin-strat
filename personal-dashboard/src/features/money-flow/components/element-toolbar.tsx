"use client";

import type { ReactNode } from "react";
import type { CanvasElementKind } from "../canvas-types";
import { CanvasToolButton } from "./canvas-tool-button";
import { ELEMENT_PRESENTATION } from "./element-presentation";

export function ElementToolbar({
  onAddElement,
  tools,
  addLabel = "Add",
  showToolLabels = false,
  children,
}: Readonly<{
  onAddElement: (kind: Exclude<CanvasElementKind, "chequing">) => void;
  tools: readonly Readonly<{
    kind: Exclude<CanvasElementKind, "chequing">;
    label: string;
  }>[];
  addLabel?: string;
  showToolLabels?: boolean;
  children?: ReactNode;
}>) {
  return (
    <section
      aria-label="Element actions"
      data-testid="money-flow-tools"
      className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/95 p-1.5 text-card-foreground shadow-lg shadow-black/5 backdrop-blur md:bottom-auto md:left-5 md:top-5 md:translate-x-0"
    >
      {addLabel && (
        <span className="hidden px-2 text-xs font-medium text-muted-foreground md:block">
          {addLabel}
        </span>
      )}
      {tools.map((tool) => {
        const Icon = ELEMENT_PRESENTATION[tool.kind].icon;
        return (
          <CanvasToolButton
            key={tool.kind}
            label={tool.label}
            className={showToolLabels ? "lg:w-auto lg:px-2.5" : undefined}
            onClick={() => onAddElement(tool.kind)}
          >
            <Icon aria-hidden="true" />
            {showToolLabels && (
              <span aria-hidden="true" className="hidden lg:inline">
                {tool.label}
              </span>
            )}
          </CanvasToolButton>
        );
      })}
      {children}
    </section>
  );
}
