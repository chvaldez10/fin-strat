"use client";

import { Focus } from "lucide-react";
import type { MoneyNodeKind } from "../types";
import { CanvasMenu, CanvasMenuAction } from "./canvas-menu";
import { ELEMENT_PRESENTATION, ELEMENT_TOOLS } from "./element-presentation";

export type CanvasContextMenuState = {
  kind: "canvas";
  x: number;
  y: number;
  position: { x: number; y: number };
};

export function CanvasContextMenu({
  menu,
  onClose,
  onAddElement,
  onFitView,
}: Readonly<{
  menu: CanvasContextMenuState;
  onClose: () => void;
  onAddElement: (
    kind: Exclude<MoneyNodeKind, "chequing">,
    position: { x: number; y: number }
  ) => void;
  onFitView: () => void;
}>) {
  return (
    <CanvasMenu
      x={menu.x}
      y={menu.y}
      title="Add an element here"
      label="Canvas actions"
      onClose={onClose}
      testId="money-flow-canvas-menu"
    >
      {ELEMENT_TOOLS.map((tool) => {
        const Icon = ELEMENT_PRESENTATION[tool.kind].icon;
        return (
          <CanvasMenuAction
            key={tool.kind}
            onClick={() => {
              onAddElement(tool.kind, menu.position);
              onClose();
            }}
          >
            <Icon aria-hidden="true" />
            {tool.label}
          </CanvasMenuAction>
        );
      })}
      <hr className="my-1 border-t border-border" />
      <CanvasMenuAction
        onClick={() => {
          onFitView();
          onClose();
        }}
      >
        <Focus aria-hidden="true" />
        Fit all elements
      </CanvasMenuAction>
    </CanvasMenu>
  );
}
