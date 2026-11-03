"use client";
import { useCallback, useRef, useState } from "react";
import type { ReactFlowInstance, Viewport } from "@xyflow/react";
import { calculateMoneyFlowTotals } from "../../calculations";
import {
  toCanvasEdges,
  updateAccountWorkspaceFromCanvas,
  type MoneyCanvasNode,
  type MoneyCanvasEdge,
} from "../../canvas-types";
import { monthsBetween } from "../../months";
import type {
  MoneyFlowDocument,
  MoneyFlowViewMode,
  YearMonth,
} from "../../types";
import { getAccountWorkspace, getCanvasNodes } from "./workspace-document";

/** Owns the current domain snapshot and the bridge to the uncontrolled canvas. */
export function useWorkspaceDocument({
  initialDocument,
  onChange,
  onAccountChange,
}: {
  initialDocument: MoneyFlowDocument;
  onChange: (document: MoneyFlowDocument) => void;
  onAccountChange: (accountId: string) => void;
}) {
  const instanceRef =
    useRef<ReactFlowInstance<MoneyCanvasNode, MoneyCanvasEdge>>(null);
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
  const {
    selectedMonth,
    selectedAccountId,
    mode: viewMode,
  } = activeDocument.view;

  const saveDocument = useCallback(
    (document: MoneyFlowDocument) => onChange(document),
    [onChange]
  );
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
      saveDocument(document);
      setActiveDocument(document);

      if (recalculate) {
        const accountId = document.view.selectedAccountId;
        const month = document.view.selectedMonth;
        const nextTotals = calculateMoneyFlowTotals(document, month, accountId);
        setTotals(nextTotals);
        const displayData = new Map(
          getCanvasNodes(document, accountId, month, nextTotals).map(
            (element) => [element.id, element.data]
          )
        );
        instanceRef.current?.setNodes((elements) =>
          elements.map((element) => ({
            ...element,
            data: { ...element.data, ...displayData.get(element.id) },
          }))
        );
      }

      return document;
    },
    [readDocument, saveDocument]
  );

  const finishMutation = useCallback(() => {
    // React Flow applies imperative node/edge updater functions through its
    // store. Read the canvas on the next frame so persistence sees the result.
    return new Promise<void>((resolve, reject) => {
      window.requestAnimationFrame(() => {
        try {
          persistDocument();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
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
      saveDocument(document);
      setTotals(nextTotals);
      setActiveDocument(document);
    },
    [saveDocument]
  );

  const handleInit = useCallback(
    (instance: ReactFlowInstance<MoneyCanvasNode, MoneyCanvasEdge>) => {
      instanceRef.current = instance;
      const savedDocument = documentRef.current;
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
    },
    []
  );

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
      saveDocument(document);
      setActiveDocument(document);
      setTotals(nextTotals);
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
    [saveDocument, selectedAccountId]
  );

  const changeAccount = useCallback(
    (accountId: string) => {
      const document = readDocument();
      documentRef.current = document;
      saveDocument(document);
      onAccountChange(accountId);
    },
    [readDocument, saveDocument, onAccountChange]
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
      saveDocument(document);
      setActiveDocument(document);

      if (mode === "table") {
        instanceRef.current = null;
      }
    },
    [readDocument, saveDocument, viewMode]
  );

  const saveViewport = useCallback(
    (viewport: Viewport) => {
      const document = readDocument();
      documentRef.current = updateAccountWorkspaceFromCanvas(
        document,
        document.view.selectedAccountId,
        instanceRef.current?.getNodes() ?? [],
        instanceRef.current?.getEdges() ?? [],
        viewport
      );
      saveDocument(documentRef.current);
    },
    [readDocument, saveDocument]
  );
  const restoreLoadedVersion = useCallback(() => {
    if (
      !window.confirm(
        "Discard changes on this screen and restore its last loaded version?"
      )
    )
      return false;
    restoreDocument(initialDocument);
    return true;
  }, [initialDocument, restoreDocument]);
  const selectedMonthIndex = monthsBetween(
    activeDocument.scenario.startMonth,
    selectedMonth
  );
  return {
    instanceRef,
    flowAreaRef,
    documentRef,
    activeDocument,
    totals,
    selectedMonth,
    viewMode,
    selectedAccountId,
    selectedMonthIndex,
    canGoPrevious: selectedMonthIndex > 0,
    canGoNext:
      selectedMonthIndex < activeDocument.scenario.forecastMonthCount - 1,
    readDocument,
    finishMutation,
    handleInit,
    saveViewport,
    restoreLoadedVersion,
    changeMonth,
    changeAccount,
    changeViewMode,
  };
}
export type WorkspaceDocument = ReturnType<typeof useWorkspaceDocument>;
