"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Focus,
  Landmark,
  NotebookPen,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MoneyNodeKind } from "../types";

type ToolDockProps = {
  canDuplicateSelection: boolean;
  canDeleteSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onAddNode: (kind: Exclude<MoneyNodeKind, "chequing">) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const nodeTools = [
  { kind: "income", label: "Add income", icon: ArrowDownToLine },
  { kind: "expense", label: "Add expense", icon: ArrowUpFromLine },
  { kind: "account", label: "Add account", icon: Landmark },
  { kind: "note", label: "Add note", icon: NotebookPen },
] as const;

export function ToolDock({
  canDuplicateSelection,
  canDeleteSelection,
  canUndo,
  canRedo,
  onAddNode,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onFitView,
  onZoomIn,
  onZoomOut,
  onReset,
}: ToolDockProps) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-md border border-border bg-background p-1 shadow-md md:bottom-auto md:left-3 md:top-3 md:max-w-none md:translate-x-0 md:flex-col">
      {nodeTools.map((tool) => {
        const Icon = tool.icon;

        return (
          <ToolButton
            key={tool.kind}
            label={tool.label}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/x-money-node",
                tool.kind
              );
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onAddNode(tool.kind)}
          >
            <Icon />
          </ToolButton>
        );
      })}

      <Divider />

      <ToolButton
        label="Duplicate"
        disabled={!canDuplicateSelection}
        onClick={onDuplicate}
      >
        <Copy />
      </ToolButton>
      <ToolButton
        label="Delete"
        disabled={!canDeleteSelection}
        onClick={onDelete}
      >
        <Trash2 />
      </ToolButton>
      <ToolButton label="Undo" disabled={!canUndo} onClick={onUndo}>
        <Undo2 />
      </ToolButton>
      <ToolButton label="Redo" disabled={!canRedo} onClick={onRedo}>
        <Redo2 />
      </ToolButton>

      <Divider />

      <ToolButton label="Fit view" onClick={onFitView}>
        <Focus />
      </ToolButton>
      <ToolButton label="Zoom in" onClick={onZoomIn}>
        <ZoomIn />
      </ToolButton>
      <ToolButton label="Zoom out" onClick={onZoomOut}>
        <ZoomOut />
      </ToolButton>
      <ToolButton label="Reset demo" onClick={onReset}>
        <RotateCcw />
      </ToolButton>
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-1 h-6 w-px shrink-0 bg-border md:mx-0 md:my-1 md:h-px md:w-6" />
  );
}

function ToolButton({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={cn(className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
