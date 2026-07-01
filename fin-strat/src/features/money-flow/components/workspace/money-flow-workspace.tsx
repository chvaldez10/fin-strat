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
import {
  calculateMoneyFlowTotals,
  getTransferAmountForMonth,
} from "../../calculations";
import {
  toCanvasEdges,
  updateAccountWorkspaceFromCanvas,
  type MoneyCanvasEdge,
  type MoneyCanvasNode,
} from "../../canvas-types";
import { createDemoMoneyFlowDocument } from "../../mock-data";
import { addMonths, monthsBetween } from "../../months";
import { createLocalMoneyFlowRepository } from "../../repository";
import type {
  MoneyFlowDocument,
  MoneyFlowViewMode,
  MoneyNodeKind,
  YearMonth,
} from "../../types";
import { validateConnection } from "../../validation";
import { MoneyEdge } from "../money-edge";
import {
  MoneyInspector,
  type SelectedMoneyElement,
} from "../money-inspector";
import { MoneyNode } from "../money-node";
import {
  NodeContextMenu,
  type NodeContextMenuState,
} from "../node-context-menu";
import { MoneySummary } from "../money-summary";
import { ToolDock } from "../tool-dock";
import { CashFlowTable } from "../cash-flow-table";
import { getAccountWorkspace, getCanvasNodes } from "./workspace-document";

const SNAP_GRID: [number, number] = [16, 16];
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
  const [totals, setTotals] = useState(() =>
    calculateMoneyFlowTotals(
      initialDocument,
      initialDocument.view.selectedMonth,
      initialDocument.view.selectedAccountId
    )
  );
  const [activeDocument, setActiveDocument] = useState(initialDocument);
  const [selectedMonth, setSelectedMonth] = useState(
    initialDocument.view.selectedMonth
  );
  const [viewMode, setViewMode] = useState<MoneyFlowViewMode>(
    initialDocument.view.mode
  );
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialDocument.view.selectedAccountId
  );
  const [selected, setSelected] = useState<SelectedMoneyElement>(null);
  const [nodeContextMenu, setNodeContextMenu] =
    useState<NodeContextMenuState | null>(null);
  const readDocument = useCallback(() => {
    const instance = instanceRef.current;

    if (!instance) {
      return documentRef.current;
    }

    return updateAccountWorkspaceFromCanvas(
      documentRef.current,
      documentRef.current.view.selectedAccountId,
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
      setActiveDocument(document);

      if (recalculate) {
        const accountId = document.view.selectedAccountId;
        const month = document.view.selectedMonth;
        const nextTotals = calculateMoneyFlowTotals(
          document,
          month,
          accountId
        );
        setTotals(nextTotals);
        const account = getAccountWorkspace(document, accountId);
        instanceRef.current?.updateNodeData(account.centerNodeId, {
          startingBalanceCents: nextTotals.startingBalanceCents,
          projectedBalanceCents: nextTotals.projectedBalanceCents,
        });
      }

      return document;
    },
    [readDocument, repository]
  );

  const finishMutation = useCallback(() => {
    // React Flow applies imperative node/edge updater functions through its
    // store. Read the canvas on the next frame so persistence sees the result.
    window.requestAnimationFrame(() => persistDocument());
  }, [persistDocument]);

  const restoreDocument = useCallback(
    (document: MoneyFlowDocument) => {
      const instance = instanceRef.current;
      const nextTotals = calculateMoneyFlowTotals(
        document,
        document.view.selectedMonth,
        document.view.selectedAccountId
      );
      const account = getAccountWorkspace(document);
      if (instance) {
        instance.setNodes(
          getCanvasNodes(document, account.id, document.view.selectedMonth)
        );
        instance.setEdges(
          toCanvasEdges(account.transfers, document.view.selectedMonth)
        );
        void instance.setViewport(account.viewport);
      }
      documentRef.current = document;
      repository.save(document);
      setTotals(nextTotals);
      setActiveDocument(document);
      setSelectedMonth(document.view.selectedMonth);
      setSelectedAccountId(document.view.selectedAccountId);
      setViewMode(document.view.mode);
      setSelected(null);
    },
    [repository]
  );

  const handleInit = useCallback(
    (instance: ReactFlowInstance<MoneyCanvasNode, MoneyCanvasEdge>) => {
      instanceRef.current = instance;
      const savedDocument = repository.load();
      const savedTotals = calculateMoneyFlowTotals(
        savedDocument,
        savedDocument.view.selectedMonth,
        savedDocument.view.selectedAccountId
      );
      documentRef.current = savedDocument;
      const account = getAccountWorkspace(savedDocument);
      instance.setNodes(
        getCanvasNodes(
          savedDocument,
          account.id,
          savedDocument.view.selectedMonth
        )
      );
      instance.setEdges(
        toCanvasEdges(account.transfers, savedDocument.view.selectedMonth)
      );
      void instance.setViewport(account.viewport);
      setTotals(savedTotals);
      setActiveDocument(savedDocument);
      setSelectedMonth(savedDocument.view.selectedMonth);
      setSelectedAccountId(savedDocument.view.selectedAccountId);
      setViewMode(savedDocument.view.mode);
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
      finishMutation();
      window.requestAnimationFrame(() => {
        instance.setNodes((nodes) =>
          nodes.map((item) => ({
            ...item,
            selected: item.id === id,
          }))
        );
      });
    },
    [finishMutation]
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

      const document = readDocument();
      const validation = validateConnection(getAccountWorkspace(document), {
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
          baseMonthlyAmountCents: 10000,
          startMonth: selectedMonth,
        },
        markerEnd: defaultEdgeOptions.markerEnd,
      });
      finishMutation();
    },
    [finishMutation, readDocument, selectedMonth]
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
    setSelected({ type: "node", item: duplicate });
    finishMutation();
  }, [finishMutation]);

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
    finishMutation();
  }, [finishMutation]);

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

      const currentDocument = readDocument();
      if (typeof values.startingBalanceCents === "number") {
        documentRef.current = {
          ...currentDocument,
          accounts: currentDocument.accounts.map((account) =>
            account.id === selectedAccountId && account.centerNodeId === id
              ? {
                  ...account,
                  name: values.label,
                  openingBalanceCents: values.startingBalanceCents!,
                }
              : account
          ),
        };
      }
      instance.updateNodeData(id, {
        label: values.label,
        note: values.note || undefined,
      });
      finishMutation();
    },
    [finishMutation, readDocument, selectedAccountId]
  );

  const saveEdge = useCallback(
    (
      id: string,
      values: {
        label: string;
        baseMonthlyAmountCents: number;
        monthOverrideCents: number | null;
        startMonth: YearMonth;
        endMonth?: YearMonth;
      }
    ) => {
      const instance = instanceRef.current;

      if (!instance) {
        return;
      }

      const edge = instance.getEdge(id);

      if (!edge?.data) {
        return;
      }

      const monthOverrides = { ...edge.data.monthOverrides };

      if (values.monthOverrideCents === null) {
        delete monthOverrides[selectedMonth];
      } else {
        monthOverrides[selectedMonth] = values.monthOverrideCents;
      }

      const updatedTransfer = {
        id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        baseMonthlyAmountCents: values.baseMonthlyAmountCents,
        startMonth: values.startMonth,
        endMonth: values.endMonth,
        monthOverrides,
        label: values.label || undefined,
      };

      instance.updateEdgeData(id, {
        label: values.label || undefined,
        baseMonthlyAmountCents: values.baseMonthlyAmountCents,
        startMonth: values.startMonth,
        endMonth: values.endMonth,
        monthOverrides,
        monthlyAmountCents: getTransferAmountForMonth(
          updatedTransfer,
          selectedMonth
        ),
      });
      finishMutation();
    },
    [finishMutation, selectedMonth]
  );

  const reset = useCallback(() => {
    if (!window.confirm("Reset this canvas to the demo money flow?")) {
      return;
    }

    const document = repository.reset();
    restoreDocument(document);
  }, [repository, restoreDocument]);

  const changeMonth = useCallback(
    (month: YearMonth) => {
      // Month navigation only changes the projection. Canvas mutations are
      // already persisted at their semantic action boundaries.
      const currentDocument = documentRef.current;
      const document: MoneyFlowDocument = {
        ...currentDocument,
        view: {
          ...currentDocument.view,
          selectedMonth: month,
        },
      };
      const nextTotals = calculateMoneyFlowTotals(
        document,
        month,
        selectedAccountId
      );

      documentRef.current = document;
      repository.save(document);
      setActiveDocument(document);
      setSelectedMonth(month);
      setTotals(nextTotals);
      clearSelection();
      instanceRef.current?.setNodes(
        getCanvasNodes(document, selectedAccountId, month)
      );
      instanceRef.current?.setEdges(
        toCanvasEdges(
          getAccountWorkspace(document, selectedAccountId).transfers,
          month
        )
      );
    },
    [clearSelection, repository, selectedAccountId]
  );

  const changeAccount = useCallback(
    (accountId: string) => {
      const currentDocument = instanceRef.current
        ? readDocument()
        : documentRef.current;
      const document: MoneyFlowDocument = {
        ...currentDocument,
        view: {
          ...currentDocument.view,
          selectedAccountId: accountId,
        },
      };
      const account = getAccountWorkspace(document, accountId);

      documentRef.current = document;
      repository.save(document);
      setActiveDocument(document);
      setSelectedAccountId(accountId);
      setTotals(calculateMoneyFlowTotals(document, selectedMonth, accountId));
      clearSelection();
      setNodeContextMenu(null);
      instanceRef.current?.setNodes(
        getCanvasNodes(document, account.id, selectedMonth)
      );
      instanceRef.current?.setEdges(
        toCanvasEdges(account.transfers, selectedMonth)
      );
      void instanceRef.current?.setViewport(account.viewport);
    },
    [clearSelection, readDocument, repository, selectedMonth]
  );

  const changeViewMode = useCallback(
    (mode: MoneyFlowViewMode) => {
      if (mode === viewMode) {
        return;
      }

      const currentDocument = instanceRef.current
        ? readDocument()
        : documentRef.current;
      const document: MoneyFlowDocument = {
        ...currentDocument,
        view: {
          ...currentDocument.view,
          mode,
        },
      };

      documentRef.current = document;
      repository.save(document);
      setActiveDocument(document);
      setViewMode(mode);
      setSelected(null);
      setNodeContextMenu(null);

      if (mode === "table") {
        instanceRef.current = null;
      }
    },
    [readDocument, repository, viewMode]
  );

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

      if (commandKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelection();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
      } else if (event.key === "Escape") {
        clearSelection();
      }
    },
    [clearSelection, deleteSelection, duplicateSelection]
  );

  const canDuplicate =
    selected?.type === "node" && selected.item.data.kind !== "chequing";
  const canDelete =
    selected?.type === "edge" ||
    (selected?.type === "node" && selected.item.data.kind !== "chequing");
  const selectedMonthIndex = monthsBetween(
    activeDocument.scenario.startMonth,
    selectedMonth
  );
  const canGoPrevious = selectedMonthIndex > 0;
  const canGoNext =
    selectedMonthIndex < activeDocument.scenario.forecastMonthCount - 1;

  return (
    <TooltipProvider>
      <div
        ref={canvasRef}
        className="flex h-[calc(100dvh-4rem)] min-h-[36rem] w-full min-w-0 max-w-full flex-col overflow-hidden bg-background outline-none md:min-h-[42rem]"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <MoneySummary
          totals={totals}
          month={selectedMonth}
          viewMode={viewMode}
          accounts={activeDocument.accounts}
          selectedAccountId={selectedAccountId}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPreviousMonth={() => changeMonth(addMonths(selectedMonth, -1))}
          onNextMonth={() => changeMonth(addMonths(selectedMonth, 1))}
          onViewModeChange={changeViewMode}
          onAccountChange={changeAccount}
        />
        {viewMode === "table" ? (
          <div className="min-h-0 flex-1">
            <CashFlowTable
              document={activeDocument}
              selectedMonth={selectedMonth}
              selectedAccountId={selectedAccountId}
            />
          </div>
        ) : (
          <div
            ref={flowAreaRef}
            className="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden"
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
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={handleInit}
            onConnect={handleConnect}
            onNodeClick={(_, node) => {
              setNodeContextMenu(null);
              setSelected({ type: "node", item: node });
            }}
            onEdgeClick={(_, edge) => {
              setNodeContextMenu(null);
              setSelected({ type: "edge", item: edge });
            }}
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
              setSelected(null);
            }}
            onNodeDragStop={() => {
              finishMutation();
            }}
            onMoveEnd={(_, viewport: Viewport) => {
              const document = readDocument();
              const accountId = document.view.selectedAccountId;
              documentRef.current = updateAccountWorkspaceFromCanvas(
                document,
                accountId,
                instanceRef.current?.getNodes() ?? [],
                instanceRef.current?.getEdges() ?? [],
                viewport
              );
              repository.save(documentRef.current);
            }}
            onMoveStart={() => setNodeContextMenu(null)}
            isValidConnection={(connection) => {
              if (!connection.source || !connection.target) {
                return false;
              }

              return validateConnection(getAccountWorkspace(readDocument()), {
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
            onAddNode={createNode}
            onDuplicate={duplicateSelection}
            onDelete={deleteSelection}
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
            openingBalancesByNodeId={{
              [getAccountWorkspace(activeDocument, selectedAccountId)
                .centerNodeId]: getAccountWorkspace(
                activeDocument,
                selectedAccountId
              ).openingBalanceCents,
            }}
            selectedMonth={selectedMonth}
            isFirstMonth={selectedMonthIndex === 0}
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
        )}
      </div>
    </TooltipProvider>
  );
}
