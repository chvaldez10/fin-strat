"use client";
import {
  useCallback,
  useEffect,
  useState,
  type DragEvent,
  type RefObject,
} from "react";
import type { ReactFlowProps } from "@xyflow/react";
import type { MoneyCanvasNode, MoneyCanvasEdge } from "../../canvas-types";
import type { MoneyNodeKind } from "../../types";
import type { CanvasContextMenuState } from "../canvas-context-menu";
import type { ElementContextMenuState } from "../element-context-menu";
import { canvasMotionDuration } from "./canvas-config";
import type { WorkspaceDocument } from "./use-workspace-document";
import type { ElementCommands } from "./use-element-commands";

/** Pointer and keyboard routing stays separate from financial edit commands. */
export function useCanvasInteractions({
  editor,
  commands,
  workspaceRef,
}: {
  editor: Pick<
    WorkspaceDocument,
    "instanceRef" | "flowAreaRef" | "finishMutation" | "saveViewport"
  >;
  commands: Pick<
    ElementCommands,
    | "selected"
    | "selectElement"
    | "clearSelection"
    | "createElement"
    | "duplicateSelection"
    | "deleteSelection"
  >;
  workspaceRef: RefObject<HTMLDivElement | null>;
}) {
  const { instanceRef, flowAreaRef, finishMutation, saveViewport } = editor;
  const {
    selected,
    selectElement,
    clearSelection,
    createElement,
    duplicateSelection,
    deleteSelection,
  } = commands;
  const [contextMenu, setContextMenu] = useState<
    CanvasContextMenuState | ElementContextMenuState | null
  >(null);
  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const openCanvasMenu = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = flowAreaRef.current?.getBoundingClientRect();
      const instance = instanceRef.current;
      if (!bounds || !instance) return;
      setContextMenu({
        kind: "canvas",
        x: clientX - bounds.left,
        y: clientY - bounds.top,
        position: instance.screenToFlowPosition(
          { x: clientX, y: clientY },
          { snapToGrid: true }
        ),
      });
    },
    [flowAreaRef, instanceRef]
  );
  const openCanvasMenuAtCenter = useCallback(() => {
    const bounds = flowAreaRef.current?.getBoundingClientRect();
    if (bounds)
      openCanvasMenu(
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2
      );
  }, [flowAreaRef, openCanvasMenu]);
  const fitCanvas = useCallback(() => {
    void instanceRef.current?.fitView({
      padding: 0.22,
      duration: canvasMotionDuration(220),
    });
  }, [instanceRef]);
  const zoomIn = useCallback(() => {
    void instanceRef.current?.zoomIn({ duration: canvasMotionDuration(160) });
  }, [instanceRef]);
  const zoomOut = useCallback(() => {
    void instanceRef.current?.zoomOut({ duration: canvasMotionDuration(160) });
  }, [instanceRef]);
  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(
        "application/x-money-node"
      ) as Exclude<MoneyNodeKind, "chequing">;

      if (!["income", "expense", "account", "note"].includes(kind)) {
        return;
      }

      const instance = instanceRef.current;

      if (!instance) {
        return;
      }

      createElement(
        kind,
        instance.screenToFlowPosition(
          { x: event.clientX, y: event.clientY },
          { snapToGrid: true }
        )
      );
    },
    [createElement, instanceRef]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!(target instanceof HTMLElement)) return;
      if (event.defaultPrevented || !workspaceRef.current?.contains(target))
        return;
      const isEditing =
        target.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='menu']"
        ) !== null;

      if (isEditing) {
        return;
      }

      const commandKey = event.ctrlKey || event.metaKey;

      if (
        commandKey &&
        event.key.toLowerCase() === "d" &&
        selected?.type === "node" &&
        selected.item.data.kind !== "chequing"
      ) {
        event.preventDefault();
        duplicateSelection();
      } else if (
        !commandKey &&
        !event.altKey &&
        selected &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        event.preventDefault();
        deleteSelection();
      } else if (event.key === "Escape") {
        clearSelection();
      }
    },
    [
      clearSelection,
      deleteSelection,
      duplicateSelection,
      selected,
      workspaceRef,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const flowHandlers = {
    onNodeClick: (_event, element) => {
      closeContextMenu();
      selectElement(element);
    },
    onPaneClick: () => {
      closeContextMenu();
      clearSelection();
    },
    onPaneContextMenu: (event) => {
      event.preventDefault();
      openCanvasMenu(event.clientX, event.clientY);
    },
    onNodeContextMenu: (event, element) => {
      event.preventDefault();
      event.stopPropagation();
      const bounds = flowAreaRef.current?.getBoundingClientRect();
      if (!bounds) return;
      instanceRef.current?.setNodes((elements) =>
        elements.map((item) => ({ ...item, selected: item.id === element.id }))
      );
      selectElement(element);
      setContextMenu({
        kind: "element",
        element,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    onNodeDragStart: closeContextMenu,
    onNodeDragStop: (_event, element) => {
      selectElement(element);
      void finishMutation();
    },
    onMoveStart: closeContextMenu,
    onMoveEnd: (_event, viewport) => saveViewport(viewport),
  } satisfies Pick<
    ReactFlowProps<MoneyCanvasNode, MoneyCanvasEdge>,
    | "onNodeClick"
    | "onPaneClick"
    | "onPaneContextMenu"
    | "onNodeContextMenu"
    | "onNodeDragStart"
    | "onNodeDragStop"
    | "onMoveStart"
    | "onMoveEnd"
  >;
  return {
    contextMenu,
    closeContextMenu,
    openCanvasMenuAtCenter,
    fitCanvas,
    zoomIn,
    zoomOut,
    handleDrop,
    flowHandlers,
  };
}
export type CanvasInteractions = ReturnType<typeof useCanvasInteractions>;
