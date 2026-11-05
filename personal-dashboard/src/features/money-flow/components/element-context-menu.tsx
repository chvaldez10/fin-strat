"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import type { MoneyCanvasNode } from "../canvas-types";
import { CanvasMenu, CanvasMenuAction } from "./canvas-menu";

export type ElementContextMenuState = {
  kind: "element";
  element: MoneyCanvasNode;
  x: number;
  y: number;
};

export function ElementContextMenu({
  menu,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: Readonly<{
  menu: ElementContextMenuState;
  onClose: () => void;
  onEdit: (element: MoneyCanvasNode) => void;
  onDuplicate: (element: MoneyCanvasNode) => void;
  onDelete: (element: MoneyCanvasNode) => void;
}>) {
  const protectedElement = menu.element.data.kind === "chequing";
  return (
    <CanvasMenu
      x={menu.x}
      y={menu.y}
      title={menu.element.data.label}
      label={`Actions for ${menu.element.data.label}`}
      onClose={onClose}
      testId="money-flow-node-menu"
    >
      <CanvasMenuAction
        onClick={() => {
          onEdit(menu.element);
          onClose();
        }}
      >
        <Pencil aria-hidden="true" />
        Edit element
      </CanvasMenuAction>
      <CanvasMenuAction
        disabled={protectedElement}
        onClick={() => {
          onDuplicate(menu.element);
          onClose();
        }}
      >
        <Copy aria-hidden="true" />
        Duplicate
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
      </CanvasMenuAction>
      <CanvasMenuAction
        destructive
        disabled={protectedElement}
        onClick={() => {
          onDelete(menu.element);
          onClose();
        }}
      >
        <Trash2 aria-hidden="true" />
        Delete<span className="ml-auto text-xs text-muted-foreground">Del</span>
      </CanvasMenuAction>
      {protectedElement && (
        <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          The tracked account stays in this workspace.
        </p>
      )}
    </CanvasMenu>
  );
}
