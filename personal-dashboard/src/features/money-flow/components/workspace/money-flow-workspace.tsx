"use client";
import { useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { addMonths } from "../../months";
import type { MoneyFlowDocument, MoneyFlowViewMode } from "../../types";
import { MoneySummary } from "../money-summary";
import { CashFlowTable } from "../cash-flow-table";
import { MoneyFlowCanvas } from "./money-flow-canvas";
import { useWorkspaceDocument } from "./use-workspace-document";
import { useElementCommands } from "./use-element-commands";
import { useCanvasInteractions } from "./use-canvas-interactions";

export function MoneyFlowWorkspace({
  initialDocument,
  accountSummaries,
  onChange,
  onAccountChange,
  onSave,
}: {
  initialDocument: MoneyFlowDocument;
  accountSummaries: Pick<
    MoneyFlowDocument["accounts"][number],
    "id" | "name" | "institution" | "accountType"
  >[];
  onChange: (document: MoneyFlowDocument) => void;
  onAccountChange: (accountId: string) => void;
  onSave: () => Promise<boolean>;
}) {
  const editor = useWorkspaceDocument({
    initialDocument,
    onChange,
    onAccountChange,
  });
  const commands = useElementCommands({ editor, onSave });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const interactions = useCanvasInteractions({
    editor,
    commands,
    workspaceRef,
  });
  const [gridVisible, setGridVisible] = useState(true);
  function changeMonth(offset: number) {
    commands.clearSelection();
    interactions.closeContextMenu();
    editor.changeMonth(addMonths(editor.selectedMonth, offset));
  }
  function changeViewMode(mode: MoneyFlowViewMode) {
    if (mode === editor.viewMode) return;
    commands.clearSelection();
    interactions.closeContextMenu();
    editor.changeViewMode(mode);
  }
  function restoreLoadedVersion() {
    if (editor.restoreLoadedVersion()) {
      commands.clearSelection();
      interactions.closeContextMenu();
    }
  }
  return (
    <TooltipProvider>
      <div
        ref={workspaceRef}
        data-testid="money-flow-workspace"
        className="flex min-h-80 flex-1 w-full min-w-0 max-w-full flex-col overflow-hidden bg-background"
      >
        <MoneySummary
          totals={editor.totals}
          month={editor.selectedMonth}
          viewMode={editor.viewMode}
          accounts={accountSummaries}
          selectedAccountId={editor.selectedAccountId}
          canGoPrevious={editor.canGoPrevious}
          canGoNext={editor.canGoNext}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onViewModeChange={changeViewMode}
          onAccountChange={editor.changeAccount}
        />
        {editor.viewMode === "table" ? (
          <div className="min-h-0 flex-1">
            <CashFlowTable
              document={editor.activeDocument}
              selectedMonth={editor.selectedMonth}
              selectedAccountId={editor.selectedAccountId}
            />
          </div>
        ) : (
          <MoneyFlowCanvas
            editor={editor}
            commands={commands}
            interactions={interactions}
            gridVisible={gridVisible}
            onToggleGrid={() => setGridVisible((visible) => !visible)}
            onRestore={restoreLoadedVersion}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
