"use client";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ReactFlow,
} from "@xyflow/react";
import {
  toCanvasEdges,
  type MoneyCanvasNode,
  type MoneyCanvasEdge,
} from "../../canvas-types";
import { ElementConnection } from "../element-connection";
import { ElementInspector } from "../element-inspector";
import { MoneyElement } from "../money-element";
import { ElementContextMenu } from "../element-context-menu";
import { ElementToolbar } from "../element-toolbar";
import { CanvasViewControls } from "../canvas-view-controls";
import { CanvasContextMenu } from "../canvas-context-menu";
import { DEFAULT_EDGE_OPTIONS, SNAP_GRID } from "./canvas-config";
import { getAccountWorkspace, getCanvasNodes } from "./workspace-document";
import type { WorkspaceDocument } from "./use-workspace-document";
import type { ElementCommands } from "./use-element-commands";
import type { CanvasInteractions } from "./use-canvas-interactions";

const nodeTypes = {
  chequing: MoneyElement,
  income: MoneyElement,
  expense: MoneyElement,
  account: MoneyElement,
  note: MoneyElement,
};
const edgeTypes = { money: ElementConnection };

/** Canvas presentation and composition; hooks supply all application behavior. */
export function MoneyFlowCanvas({
  editor,
  commands,
  interactions,
  gridVisible,
  onToggleGrid,
  onRestore,
}: Readonly<{
  editor: Pick<
    WorkspaceDocument,
    | "flowAreaRef"
    | "activeDocument"
    | "selectedAccountId"
    | "selectedMonth"
    | "selectedMonthIndex"
    | "handleInit"
  >;
  commands: ElementCommands;
  interactions: CanvasInteractions;
  gridVisible: boolean;
  onToggleGrid: () => void;
  onRestore: () => void;
}>) {
  const {
    flowAreaRef,
    activeDocument,
    selectedAccountId,
    selectedMonth,
    selectedMonthIndex,
    handleInit,
  } = editor;
  const {
    selected,
    canDuplicate,
    canDelete,
    handleConnect,
    clearSelection,
    createElement,
    duplicateElement,
    deleteElement,
    duplicateSelection,
    deleteSelection,
    saveElement,
    saveTransfer,
    removeTransfer,
    selectElement,
  } = commands;
  const { contextMenu, closeContextMenu, handleDrop, fitCanvas } = interactions;
  return (
    <div
      ref={flowAreaRef}
      className="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-muted/25 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
    >
      <ReactFlow<MoneyCanvasNode, MoneyCanvasEdge>
        defaultNodes={getCanvasNodes(
          activeDocument,
          selectedAccountId,
          selectedMonth
        )}
        defaultEdges={toCanvasEdges(
          getAccountWorkspace(activeDocument, selectedAccountId).transfers,
          selectedMonth
        )}
        defaultViewport={
          getAccountWorkspace(activeDocument, selectedAccountId).viewport
        }
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        onInit={handleInit}
        onConnect={handleConnect}
        {...interactions.flowHandlers}
        isValidConnection={commands.isValidConnection}
        snapToGrid
        snapGrid={SNAP_GRID}
        connectionLineType={ConnectionLineType.SmoothStep}
        onlyRenderVisibleElements
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectionOnDrag={false}
        panOnDrag={[0, 1]}
        panActivationKeyCode="Space"
        multiSelectionKeyCode="Shift"
        deleteKeyCode={null}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: false }}
      >
        {gridVisible && (
          <Background
            variant={BackgroundVariant.Lines}
            gap={24}
            lineWidth={1}
            color="color-mix(in oklab, var(--foreground) 20%, transparent)"
          />
        )}
        <CanvasViewControls
          inspectorOpen={!!selected}
          gridVisible={gridVisible}
          onToggleGrid={onToggleGrid}
          onFitView={fitCanvas}
          onZoomIn={interactions.zoomIn}
          onZoomOut={interactions.zoomOut}
          onReset={onRestore}
        />
      </ReactFlow>

      <ElementToolbar
        canDuplicateSelection={canDuplicate}
        canDeleteSelection={canDelete}
        onAddElement={createElement}
        onDuplicate={duplicateSelection}
        onDelete={deleteSelection}
        menuOpen={contextMenu?.kind === "canvas"}
        onOpenCanvasMenu={interactions.openCanvasMenuAtCenter}
      />
      <p className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 text-[0.7rem] text-muted-foreground/70 lg:block">
        Drag canvas to pan · Right-click to add
      </p>

      <ElementInspector
        selected={selected}
        account={getAccountWorkspace(activeDocument, selectedAccountId)}
        selectedMonth={selectedMonth}
        isFirstMonth={selectedMonthIndex === 0}
        onClose={clearSelection}
        onSaveElement={saveElement}
        onSaveTransfer={saveTransfer}
        onRemoveTransfer={removeTransfer}
      />
      {contextMenu?.kind === "element" ? (
        <ElementContextMenu
          menu={contextMenu}
          onClose={closeContextMenu}
          onEdit={(element) => selectElement(element)}
          onDuplicate={duplicateElement}
          onDelete={(element) => deleteElement({ type: "node", item: element })}
        />
      ) : contextMenu?.kind === "canvas" ? (
        <CanvasContextMenu
          menu={contextMenu}
          onClose={closeContextMenu}
          onAddElement={createElement}
          onFitView={fitCanvas}
        />
      ) : null}
    </div>
  );
}
