"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  ReactFlow,
  type Connection,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentMockUser } from "@/features/auth/mock-session";
import { calculateMoneyFlowTotals } from "../calculations";
import {
  toCanvasEdges,
  toCanvasNodes,
  toMoneyFlowDocument,
  type MoneyCanvasEdge,
  type MoneyCanvasNode,
} from "../canvas-types";
import { createDemoMoneyFlowDocument } from "../mock-data";
import { createLocalMoneyFlowRepository } from "../repository";
import type {
  MoneyFlowDocument,
  MoneyNodeKind,
} from "../types";
import { validateConnection } from "../validation";
import { MoneyEdge } from "./money-edge";
import {
  MoneyInspector,
  type SelectedMoneyElement,
} from "./money-inspector";
import { MoneyNode } from "./money-node";
import {
  NodeContextMenu,
  type NodeContextMenuState,
} from "./node-context-menu";
import { MoneySummary } from "./money-summary";
import { ToolDock } from "./tool-dock";

const SNAP_GRID: [number, number] = [16, 16];
const HISTORY_LIMIT = 50;
const nodeTypes = {
  chequing: MoneyNode,
  income: MoneyNode,
  expense: MoneyNode,
  account: MoneyNode,
  note: MoneyNode,
};
const edgeTypes = {
  money: MoneyEdge,
};
const defaultEdgeOptions = {
  type: "money",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "var(--foreground)",
  },
};

type HistoryState = {
  canUndo: boolean;
  canRedo: boolean;
};

export function MoneyFlowWorkspace() {
  const [currentUser] = useState(() => getCurrentMockUser());
  const [initialDocument] = useState(() =>
    createDemoMoneyFlowDocument(currentUser.id)
  );
  const [repository] = useState(() =>
    createLocalMoneyFlowRepository(currentUser.id)
  );
  const instanceRef =
    useRef<ReactFlowInstance<MoneyCanvasNode, MoneyCanvasEdge>>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowAreaRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef(initialDocument);
  const undoRef = useRef<MoneyFlowDocument[]>([]);
  const redoRef = useRef<MoneyFlowDocument[]>([]);
  const dragStartDocumentRef = useRef<MoneyFlowDocument | null>(null);
  const [totals, setTotals] = useState(() =>
    calculateMoneyFlowTotals(initialDocument)
  );
  const [selected, setSelected] = useState<SelectedMoneyElement>(null);
  const [nodeContextMenu, setNodeContextMenu] =
    useState<NodeContextMenuState | null>(null);
  const [historyState, setHistoryState] = useState<HistoryState>({
    canUndo: false,
    canRedo: false,
  });

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: undoRef.current.length > 0,
      canRedo: redoRef.current.length > 0,
    });
  }, []);

  const readDocument = useCallback(() => {
    const instance = instanceRef.current;

    if (!instance) {
      return documentRef.current;
    }

    return toMoneyFlowDocument(
      documentRef.current,
      instance.getNodes(),
      instance.getEdges(),
      instance.getViewport()
    );
  }, []);

  const persistDocument = useCallback(
    (recalculate = true) => {
      const document = readDocument();
      documentRef.current = document;
      repository.save(document);

      if (recalculate) {
        const nextTotals = calculateMoneyFlowTotals(document);
        setTotals(nextTotals);
        instanceRef.current?.updateNodeData("account-chequing", {
          startingBalanceCents: nextTotals.startingBalanceCents,
          projectedBalanceCents: nextTotals.projectedBalanceCents,
        });
      }

      return document;
    },
    [readDocument, repository]
  );

  const pushUndo = useCallback(
    (document: MoneyFlowDocument) => {
      undoRef.current = [...undoRef.current, document].slice(-HISTORY_LIMIT);
      redoRef.current = [];
      updateHistoryState();
    },
    [updateHistoryState]
  );

  const finishMutation = useCallback(
    (before: MoneyFlowDocument) => {
      pushUndo(before);
      window.requestAnimationFrame(() => persistDocument());
    },
    [persistDocument, pushUndo]
  );

  const restoreDocument = useCallback(
    (document: MoneyFlowDocument) => {
      const instance = instanceRef.current;

      if (!instance) {
        return;
      }

      const nextTotals = calculateMoneyFlowTotals(document);
      instance.setNodes(toCanvasNodes(document.nodes, nextTotals));
      instance.setEdges(toCanvasEdges(document.transfers));
      void instance.setViewport(document.viewport);
      documentRef.current = document;
      repository.save(document);
      setTotals(nextTotals);
      setSelected(null);
    },
    [repository]
  );

  const handleInit = useCallback(
    (instance: ReactFlowInstance<MoneyCanvasNode, MoneyCanvasEdge>) => {
      instanceRef.current = instance;
      const savedDocument = repository.load();
      const savedTotals = calculateMoneyFlowTotals(savedDocument);
      documentRef.current = savedDocument;
      instance.setNodes(toCanvasNodes(savedDocument.nodes, savedTotals));
      instance.setEdges(toCanvasEdges(savedDocument.transfers));
      void instance.setViewport(savedDocument.viewport);
      setTotals(savedTotals);
    },
    [repository]
  );

  const createNode = useCallback(
    (
      kind: Exclude<MoneyNodeKind, "chequing">,
      position?: { x: number; y: number }
    ) => {
      const instance = instanceRef.current;
      const canvas = flowAreaRef.current;

      if (!instance || !canvas) {
        return;
      }

      const before = readDocument();
      const bounds = canvas.getBoundingClientRect();
      const nodePosition =
        position ??
        instance.screenToFlowPosition(
          {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2,
          },
          { snapToGrid: true }
        );
      const id = `${kind}-${crypto.randomUUID()}`;
      const labels: Record<typeof kind, string> = {
        income: "New income",
        expense: "New expense",
        account: "New account",
        note: "New note",
      };
      const node: MoneyCanvasNode = {
        id,
        type: kind,
        position: nodePosition,
        data: {
          kind,
          label: labels[kind],
        },
      };

      instance.addNodes(node);
      finishMutation(before);
      window.requestAnimationFrame(() => {
        instance.setNodes((nodes) =>
          nodes.map((item) => ({
            ...item,
            selected: item.id === id,
          }))
        );
      });
    },
    [finishMutation, readDocument]
  );

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

      createNode(
        kind,
        instance.screenToFlowPosition(
          { x: event.clientX, y: event.clientY },
          { snapToGrid: true }
        )
      );
    },
    [createNode]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const instance = instanceRef.current;

      if (!instance || !connection.source || !connection.target) {
        return;
      }

      const before = readDocument();
      const validation = validateConnection(before, {
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
      });

      if (!validation.valid) {
        return;
      }

      const id = `flow-${crypto.randomUUID()}`;
      instance.addEdges({
        id,
        type: "money",
        source: connection.source,
        target: connection.target,
        data: {
          monthlyAmountCents: 10000,
        },
        markerEnd: defaultEdgeOptions.markerEnd,
      });
      finishMutation(before);
    },
    [finishMutation, readDocument]
  );

  const handleSelectionChange = useCallback(
    ({
      nodes,
      edges,
    }: {
      nodes: MoneyCanvasNode[];
      edges: MoneyCanvasEdge[];
    }) => {
      if (nodes.length === 1 && edges.length === 0) {
        setSelected({ type: "node", item: nodes[0] });
        return;
      }

      if (edges.length === 1 && nodes.length === 0) {
        setSelected({ type: "edge", item: edges[0] });
        return;
      }

      setSelected(null);
    },
    []
  );

  const clearSelection = useCallback(() => {
    const instance = instanceRef.current;

    instance?.setNodes((nodes) =>
      nodes.map((node) => ({ ...node, selected: false }))
    );
    instance?.setEdges((edges) =>
      edges.map((edge) => ({ ...edge, selected: false }))
    );
    setSelected(null);
  }, []);

  const duplicateNode = useCallback((source: MoneyCanvasNode) => {
    const instance = instanceRef.current;

    if (!instance || source.data.kind === "chequing") {
      return;
    }

    const before = readDocument();
    const id = `${source.data.kind}-${crypto.randomUUID()}`;
    const duplicate: MoneyCanvasNode = {
      ...source,
      id,
      selected: true,
      deletable: true,
      position: {
        x: source.position.x + 32,
        y: source.position.y + 32,
      },
      data: {
        ...source.data,
        label: `${source.data.label} copy`,
      },
    };

    instance.setNodes((nodes) => [
      ...nodes.map((node) => ({ ...node, selected: false })),
      duplicate,
    ]);
    finishMutation(before);
  }, [finishMutation, readDocument]);

  const deleteElement = useCallback((target: SelectedMoneyElement) => {
    const instance = instanceRef.current;

    if (!instance || !target) {
      return;
    }

    if (
      target.type === "node" &&
      target.item.data.kind === "chequing"
    ) {
      return;
    }

    const before = readDocument();

    if (target.type === "node") {
      const nodeId = target.item.id;
      instance.setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
      instance.setEdges((edges) =>
        edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        )
      );
    } else {
      instance.setEdges((edges) =>
        edges.filter((edge) => edge.id !== target.item.id)
      );
    }

    setSelected(null);
    finishMutation(before);
  }, [finishMutation, readDocument]);

  const duplicateSelection = useCallback(() => {
    if (selected?.type === "node") {
      duplicateNode(selected.item);
    }
  }, [duplicateNode, selected]);

  const deleteSelection = useCallback(() => {
    deleteElement(selected);
  }, [deleteElement, selected]);

  const saveNode = useCallback(
    (
      id: string,
      values: {
        label: string;
        note: string;
        startingBalanceCents?: number;
      }
    ) => {
      const instance = instanceRef.current;

      if (!instance) {
        return;
      }

      const before = readDocument();
      if (typeof values.startingBalanceCents === "number") {
        documentRef.current = {
          ...before,
          scenario: {
            ...before.scenario,
            startingBalanceCents: values.startingBalanceCents,
          },
        };
      }
      instance.updateNodeData(id, {
        label: values.label,
        note: values.note || undefined,
      });
      finishMutation(before);
    },
    [finishMutation, readDocument]
  );

  const saveEdge = useCallback(
    (
      id: string,
      values: { label: string; monthlyAmountCents: number }
    ) => {
      const instance = instanceRef.current;

      if (!instance) {
        return;
      }

      const before = readDocument();
      instance.updateEdgeData(id, {
        label: values.label || undefined,
        monthlyAmountCents: values.monthlyAmountCents,
      });
      finishMutation(before);
    },
    [finishMutation, readDocument]
  );

  const undo = useCallback(() => {
    const previous = undoRef.current.at(-1);

    if (!previous) {
      return;
    }

    const current = readDocument();
    undoRef.current = undoRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, current].slice(-HISTORY_LIMIT);
    restoreDocument(previous);
    updateHistoryState();
  }, [readDocument, restoreDocument, updateHistoryState]);

  const redo = useCallback(() => {
    const next = redoRef.current.at(-1);

    if (!next) {
      return;
    }

    const current = readDocument();
    redoRef.current = redoRef.current.slice(0, -1);
    undoRef.current = [...undoRef.current, current].slice(-HISTORY_LIMIT);
    restoreDocument(next);
    updateHistoryState();
  }, [readDocument, restoreDocument, updateHistoryState]);

  const reset = useCallback(() => {
    if (!window.confirm("Reset this canvas to the demo money flow?")) {
      return;
    }

    const before = readDocument();
    const document = repository.reset();
    pushUndo(before);
    restoreDocument(document);
  }, [pushUndo, readDocument, repository, restoreDocument]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isEditing) {
        return;
      }

      const commandKey = event.ctrlKey || event.metaKey;

      if (commandKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (commandKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (commandKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelection();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
      } else if (event.key === "Escape") {
        clearSelection();
      }
    },
    [clearSelection, deleteSelection, duplicateSelection, redo, undo]
  );

  const canDuplicate =
    selected?.type === "node" && selected.item.data.kind !== "chequing";
  const canDelete =
    selected?.type === "edge" ||
    (selected?.type === "node" && selected.item.data.kind !== "chequing");

  return (
    <TooltipProvider>
      <div
        ref={canvasRef}
        className="flex h-[calc(100dvh-4rem)] min-h-[42rem] flex-col overflow-hidden bg-background outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <MoneySummary totals={totals} />
        <div
          ref={flowAreaRef}
          className="relative min-h-0 flex-1"
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
        >
          <ReactFlow<MoneyCanvasNode, MoneyCanvasEdge>
            defaultNodes={toCanvasNodes(
              initialDocument.nodes,
              calculateMoneyFlowTotals(initialDocument)
            )}
            defaultEdges={toCanvasEdges(initialDocument.transfers)}
            defaultViewport={initialDocument.viewport}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={handleInit}
            onConnect={handleConnect}
            onSelectionChange={handleSelectionChange}
            onPaneClick={() => {
              setNodeContextMenu(null);
              clearSelection();
            }}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();
              const bounds = flowAreaRef.current?.getBoundingClientRect();

              if (!bounds) {
                return;
              }

              const menuWidth = 176;
              const menuHeight = node.data.kind === "chequing" ? 142 : 102;
              const x = Math.min(
                event.clientX - bounds.left,
                bounds.width - menuWidth - 8
              );
              const y = Math.min(
                event.clientY - bounds.top,
                bounds.height - menuHeight - 8
              );

              instanceRef.current?.setNodes((nodes) =>
                nodes.map((item) => ({
                  ...item,
                  selected: item.id === node.id,
                }))
              );
              instanceRef.current?.setEdges((edges) =>
                edges.map((edge) => ({ ...edge, selected: false }))
              );
              setSelected({ type: "node", item: node });
              setNodeContextMenu({
                node,
                x: Math.max(8, x),
                y: Math.max(8, y),
              });
            }}
            onNodeDragStart={() => {
              setNodeContextMenu(null);
              dragStartDocumentRef.current = readDocument();
            }}
            onNodeDragStop={() => {
              const before = dragStartDocumentRef.current;
              dragStartDocumentRef.current = null;

              if (before) {
                finishMutation(before);
              }
            }}
            onMoveEnd={(_, viewport: Viewport) => {
              documentRef.current = {
                ...readDocument(),
                viewport,
              };
              repository.save(documentRef.current);
            }}
            onMoveStart={() => setNodeContextMenu(null)}
            isValidConnection={(connection) => {
              if (!connection.source || !connection.target) {
                return false;
              }

              return validateConnection(readDocument(), {
                sourceNodeId: connection.source,
                targetNodeId: connection.target,
              }).valid;
            }}
            snapToGrid
            snapGrid={SNAP_GRID}
            connectionLineType={ConnectionLineType.Step}
            onlyRenderVisibleElements
            nodesDraggable
            nodesConnectable
            elementsSelectable
            selectionOnDrag={false}
            panOnDrag={[2]}
            panActivationKeyCode="Space"
            multiSelectionKeyCode="Shift"
            deleteKeyCode={null}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: false }}
          >
            <Background
              variant={BackgroundVariant.Lines}
              gap={16}
              size={1}
              color="var(--border)"
            />
          </ReactFlow>

          <ToolDock
            canDuplicateSelection={canDuplicate}
            canDeleteSelection={canDelete}
            canUndo={historyState.canUndo}
            canRedo={historyState.canRedo}
            onAddNode={createNode}
            onDuplicate={duplicateSelection}
            onDelete={deleteSelection}
            onUndo={undo}
            onRedo={redo}
            onFitView={() =>
              void instanceRef.current?.fitView({
                padding: 0.18,
                duration: 220,
              })
            }
            onZoomIn={() => void instanceRef.current?.zoomIn({ duration: 160 })}
            onZoomOut={() =>
              void instanceRef.current?.zoomOut({ duration: 160 })
            }
            onReset={reset}
          />

          <MoneyInspector
            selected={selected}
            startingBalanceCents={totals.startingBalanceCents}
            onClose={clearSelection}
            onSaveNode={saveNode}
            onSaveEdge={saveEdge}
          />
          {nodeContextMenu ? (
            <NodeContextMenu
              menu={nodeContextMenu}
              onClose={() => setNodeContextMenu(null)}
              onDuplicate={duplicateNode}
              onDelete={(node) =>
                deleteElement({ type: "node", item: node })
              }
            />
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
