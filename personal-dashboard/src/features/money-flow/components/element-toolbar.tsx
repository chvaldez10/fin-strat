"use client";

import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { CanvasToolButton } from "./canvas-tool-button";
import type { MoneyNodeKind } from "../types";
import { ELEMENT_PRESENTATION, ELEMENT_TOOLS } from "./element-presentation";

export function ElementToolbar({
  canDuplicateSelection,
  canDeleteSelection,
  onAddElement,
  onDuplicate,
  onDelete,
  onOpenCanvasMenu,
  menuOpen,
}: Readonly<{
  canDuplicateSelection: boolean;
  canDeleteSelection: boolean;
  onAddElement: (kind: Exclude<MoneyNodeKind, "chequing">) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenCanvasMenu: () => void;
  menuOpen: boolean;
}>) {
  return (
    <section
      aria-label="Element actions"
      data-testid="money-flow-tools"
      className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/95 p-1.5 text-card-foreground shadow-lg shadow-black/5 backdrop-blur md:bottom-auto md:left-5 md:top-5 md:translate-x-0"
    >
      <span className="hidden px-2 text-xs font-medium text-muted-foreground md:block">
        Add
      </span>
      {ELEMENT_TOOLS.map((tool) => {
        const Icon = ELEMENT_PRESENTATION[tool.kind].icon;
        return (
          <CanvasToolButton
            key={tool.kind}
            label={tool.label}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-money-node", tool.kind);
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onAddElement(tool.kind)}
          >
            <Icon />
          </CanvasToolButton>
        );
      })}
      <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
      <CanvasToolButton
        label="Duplicate"
        disabled={!canDuplicateSelection}
        onClick={onDuplicate}
      >
        <Copy />
      </CanvasToolButton>
      <CanvasToolButton
        label="Canvas menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={onOpenCanvasMenu}
      >
        <MoreHorizontal />
      </CanvasToolButton>
      <CanvasToolButton
        label="Delete"
        disabled={!canDeleteSelection}
        onClick={onDelete}
      >
        <Trash2 />
      </CanvasToolButton>
    </section>
  );
}
