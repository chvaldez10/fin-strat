"use client";
import { useCallback, useState } from "react";
import type { Connection } from "@xyflow/react";
import { getTransferAmountForMonth } from "../../calculations";
import { toCanvasEdges, type MoneyCanvasNode } from "../../canvas-types";
import { removeTransfers, updateTransfer } from "../../transfers";
import type { MoneyNodeKind, YearMonth } from "../../types";
import { validateConnection } from "../../validation";
import type {
  ElementEditValues,
  ElementTransferValues,
  SelectedMoneyElement,
} from "../element-editor-types";
import { DEFAULT_EDGE_OPTIONS } from "./canvas-config";
import { getAccountWorkspace } from "./workspace-document";
import type { WorkspaceDocument } from "./use-workspace-document";

/** Element commands own their selection changes and completed-save boundaries. */
export function useElementCommands({
  editor,
  onSave,
}: {
  editor: Pick<
    WorkspaceDocument,
    | "instanceRef"
    | "flowAreaRef"
    | "documentRef"
    | "readDocument"
    | "finishMutation"
    | "selectedMonth"
    | "selectedAccountId"
  >;
  onSave: () => Promise<boolean>;
}) {
  const {
    instanceRef,
    flowAreaRef,
    documentRef,
    readDocument,
    finishMutation,
    selectedMonth,
    selectedAccountId,
  } = editor;
  const [selected, setSelected] = useState<SelectedMoneyElement>(null);
  const selectElement = useCallback(
    (element: MoneyCanvasNode) => setSelected({ type: "node", item: element }),
    []
  );
  const createElement = useCallback(
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
        account: "Transfer destination",
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
        setSelected({ type: "node", item: node });
      });
    },
    [finishMutation, flowAreaRef, instanceRef]
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
        markerEnd: DEFAULT_EDGE_OPTIONS.markerEnd,
      });
      finishMutation();
    },
    [finishMutation, readDocument, selectedMonth, instanceRef]
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
  }, [instanceRef]);

  const duplicateElement = useCallback(
    (source: MoneyCanvasNode) => {
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
    },
    [finishMutation, instanceRef]
  );

  const deleteElement = useCallback(
    (target: SelectedMoneyElement) => {
      const instance = instanceRef.current;

      if (!instance || !target) {
        return;
      }

      if (target.item.data.kind === "chequing") {
        return;
      }

      const document = readDocument();
      const accountId = document.view.selectedAccountId;
      const removedIds = getAccountWorkspace(document)
        .transfers.filter(
          (transfer) =>
            transfer.sourceNodeId === target.item.id ||
            transfer.targetNodeId === target.item.id
        )
        .map((transfer) => transfer.id);
      documentRef.current = removeTransfers(document, accountId, removedIds);

      const nodeId = target.item.id;
      instance.setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
      instance.setEdges((edges) =>
        edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );

      setSelected(null);
      finishMutation();
    },
    [finishMutation, readDocument, documentRef, instanceRef]
  );

  const duplicateSelection = useCallback(() => {
    if (selected?.type === "node") {
      duplicateElement(
        instanceRef.current?.getNode(selected.item.id) ?? selected.item
      );
    }
  }, [duplicateElement, selected, instanceRef]);

  const deleteSelection = useCallback(() => {
    deleteElement(selected);
  }, [deleteElement, selected]);

  const saveElement = useCallback(
    async (id: string, values: ElementEditValues) => {
      const instance = instanceRef.current;

      if (!instance) {
        return false;
      }

      const currentDocument = readDocument();
      documentRef.current = currentDocument;
      if (getAccountWorkspace(currentDocument).centerNodeId === id) {
        documentRef.current = {
          ...currentDocument,
          accounts: currentDocument.accounts.map((account) =>
            account.id === selectedAccountId && account.centerNodeId === id
              ? {
                  ...account,
                  name: values.label,
                  openingBalanceCents:
                    values.startingBalanceCents ?? account.openingBalanceCents,
                }
              : account
          ),
        };
      }
      const account = getAccountWorkspace(
        documentRef.current,
        selectedAccountId
      );
      const node = account.nodes.find((item) => item.id === id);
      if (
        values.flow &&
        node &&
        ["income", "expense", "account"].includes(node.kind)
      ) {
        const existing = values.flow.transferId
          ? account.transfers.find(
              (transfer) =>
                transfer.id === values.flow!.transferId &&
                (transfer.sourceNodeId === id || transfer.targetNodeId === id)
            )
          : undefined;
        if (values.flow.transferId && !existing) return false;
        const monthOverrides = { ...existing?.monthOverrides };
        if (values.flow.monthOverrideCents === null) {
          delete monthOverrides[selectedMonth];
        } else {
          monthOverrides[selectedMonth] = values.flow.monthOverrideCents;
        }
        const transfer = {
          ...existing,
          id: existing?.id ?? `flow-${crypto.randomUUID()}`,
          sourceNodeId:
            existing?.sourceNodeId ??
            (node.kind === "income" ? id : account.centerNodeId),
          targetNodeId:
            existing?.targetNodeId ??
            (node.kind === "income" ? account.centerNodeId : id),
          baseMonthlyAmountCents: values.flow.baseMonthlyAmountCents,
          startMonth: values.flow.startDate.slice(0, 7) as YearMonth,
          endMonth: values.flow.endDate?.slice(0, 7) as YearMonth | undefined,
          startDate: values.flow.startDate,
          endDate: values.flow.endDate,
          label: values.flow.label || undefined,
          monthOverrides,
        };
        documentRef.current = existing
          ? updateTransfer(
              documentRef.current,
              account.id,
              existing.id,
              transfer
            )
          : {
              ...documentRef.current,
              accounts: documentRef.current.accounts.map((item) =>
                item.id === account.id
                  ? { ...item, transfers: [...item.transfers, transfer] }
                  : item
              ),
            };
        instance.setEdges(
          toCanvasEdges(
            getAccountWorkspace(documentRef.current).transfers,
            selectedMonth
          )
        );
      }
      instance.updateNodeData(id, {
        label: values.label,
        note: values.note || undefined,
      });
      await finishMutation();
      return onSave();
    },
    [
      finishMutation,
      readDocument,
      selectedAccountId,
      selectedMonth,
      onSave,
      instanceRef,
      documentRef,
    ]
  );

  const saveTransfer = useCallback(
    async (nodeId: string, id: string, values: ElementTransferValues) => {
      const instance = instanceRef.current;

      if (!instance) {
        return false;
      }

      const document = readDocument();
      const transfer = getAccountWorkspace(document).transfers.find(
        (item) =>
          item.id === id &&
          (item.sourceNodeId === nodeId || item.targetNodeId === nodeId)
      );
      if (!transfer) {
        return false;
      }

      const monthOverrides = { ...transfer.monthOverrides };

      if (values.monthOverrideCents === null) {
        delete monthOverrides[selectedMonth];
      } else {
        monthOverrides[selectedMonth] = values.monthOverrideCents;
      }

      const updatedTransfer = {
        id,
        sourceNodeId: transfer.sourceNodeId,
        targetNodeId: transfer.targetNodeId,
        baseMonthlyAmountCents: values.baseMonthlyAmountCents,
        startMonth: values.startDate.slice(0, 7) as YearMonth,
        endMonth: values.endDate?.slice(0, 7) as YearMonth | undefined,
        startDate: values.startDate,
        endDate: values.endDate,
        monthOverrides,
        label: values.label || undefined,
      };

      documentRef.current = updateTransfer(
        document,
        document.view.selectedAccountId,
        id,
        updatedTransfer
      );

      instance.updateEdgeData(id, {
        label: values.label || undefined,
        baseMonthlyAmountCents: values.baseMonthlyAmountCents,
        startMonth: updatedTransfer.startMonth,
        endMonth: updatedTransfer.endMonth,
        startDate: updatedTransfer.startDate,
        endDate: updatedTransfer.endDate,
        monthOverrides,
        monthlyAmountCents: getTransferAmountForMonth(
          updatedTransfer,
          selectedMonth
        ),
      });
      await finishMutation();
      return onSave();
    },
    [
      finishMutation,
      readDocument,
      selectedMonth,
      onSave,
      instanceRef,
      documentRef,
    ]
  );

  const removeTransfer = useCallback(
    async (nodeId: string, id: string) => {
      const instance = instanceRef.current;
      if (!instance) return false;
      const document = readDocument();
      const account = getAccountWorkspace(document);
      if (
        !account.transfers.some(
          (transfer) =>
            transfer.id === id &&
            (transfer.sourceNodeId === nodeId ||
              transfer.targetNodeId === nodeId)
        )
      )
        return false;
      documentRef.current = removeTransfers(document, account.id, [id]);
      instance.setEdges(
        toCanvasEdges(
          getAccountWorkspace(documentRef.current).transfers,
          selectedMonth
        )
      );
      await finishMutation();
      const saved = await onSave();
      if (saved) clearSelection();
      return saved;
    },
    [
      clearSelection,
      finishMutation,
      onSave,
      readDocument,
      selectedMonth,
      instanceRef,
      documentRef,
    ]
  );

  const isValidConnection = useCallback(
    (connection: Pick<Connection, "source" | "target">) =>
      !!connection.source &&
      !!connection.target &&
      validateConnection(getAccountWorkspace(readDocument()), {
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
      }).valid,
    [readDocument]
  );
  const canDuplicate = !!selected && selected.item.data.kind !== "chequing";
  return {
    selected,
    selectElement,
    clearSelection,
    canDuplicate,
    canDelete: canDuplicate,
    createElement,
    duplicateElement,
    deleteElement,
    duplicateSelection,
    deleteSelection,
    saveElement,
    saveTransfer,
    removeTransfer,
    handleConnect,
    isValidConnection,
  };
}
export type ElementCommands = ReturnType<typeof useElementCommands>;
