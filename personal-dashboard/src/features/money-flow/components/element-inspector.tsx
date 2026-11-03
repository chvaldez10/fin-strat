"use client";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MoneyFlowAccountWorkspace, YearMonth } from "../types";
import { getElementConnections } from "../elements";
import type {
  SelectedMoneyElement,
  ElementEditValues,
  ElementTransferValues,
} from "./element-editor-types";
import { ELEMENT_PRESENTATION } from "./element-presentation";
import { ElementDetailsForm } from "./element-details-form";
import { ElementTransferForm } from "./element-transfer-form";

type ElementInspectorProps = {
  selected: SelectedMoneyElement;
  account: MoneyFlowAccountWorkspace;
  selectedMonth: YearMonth;
  isFirstMonth: boolean;
  onClose: () => void;
  onSaveElement: (id: string, values: ElementEditValues) => Promise<boolean>;
  onSaveTransfer: (
    nodeId: string,
    id: string,
    values: ElementTransferValues
  ) => Promise<boolean>;
  onRemoveTransfer: (nodeId: string, transferId: string) => Promise<boolean>;
};

export function ElementInspector({
  selected,
  account,
  selectedMonth,
  isFirstMonth,
  onClose,
  onSaveElement,
  onSaveTransfer,
  onRemoveTransfer,
}: ElementInspectorProps) {
  const isMobile = useIsMobile();

  if (!selected) {
    return null;
  }

  const node = selected.item;
  const presentation = ELEMENT_PRESENTATION[node.data.kind];
  const Icon = presentation.icon;
  const title = {
    income: "Edit income",
    expense: "Edit expense",
    account: "Edit transfer destination",
    note: "Edit note",
    chequing: "Edit bank account",
  }[node.data.kind];
  const { primary, additional } = getElementConnections(account, node.id);
  const primaryOtherId = primary
    ? primary.sourceNodeId === node.id
      ? primary.targetNodeId
      : primary.sourceNodeId
    : undefined;
  const primaryOther = account.nodes.find(
    (item) => item.id === primaryOtherId
  )?.label;

  const content = (
    <div className="space-y-5">
      {primaryOther && (
        <p className="text-xs text-muted-foreground">
          {primary?.sourceNodeId === node.id ? "To" : "From"} {primaryOther}
        </p>
      )}
      <ElementDetailsForm
        key={`${node.id}:${selectedMonth}`}
        element={node}
        startingBalanceCents={account.openingBalanceCents}
        isFirstMonth={isFirstMonth}
        primaryTransfer={primary}
        selectedMonth={selectedMonth}
        onSave={onSaveElement}
        onRemoveTransfer={(id) => onRemoveTransfer(node.id, id)}
      />
      {additional.map((transfer) => {
        const outgoing = transfer.sourceNodeId === node.id;
        const otherId = outgoing
          ? transfer.targetNodeId
          : transfer.sourceNodeId;
        const other =
          account.nodes.find((item) => item.id === otherId)?.label ??
          "Connected box";
        return (
          <details
            key={`${node.id}:${transfer.id}:${selectedMonth}`}
            className="rounded-xl border border-border/70 bg-muted/20 p-3"
          >
            <summary className="cursor-pointer text-sm font-medium">
              {outgoing ? "To" : "From"} {other}
            </summary>
            <div className="pt-4">
              <ElementTransferForm
                transfer={transfer}
                selectedMonth={selectedMonth}
                onSave={(id, values) => onSaveTransfer(node.id, id, values)}
                onRemove={() => onRemoveTransfer(node.id, transfer.id)}
              />
            </div>
          </details>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          data-testid="money-flow-inspector"
          className="max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Changes update the monthly scenario when saved.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Money flow inspector"
      data-testid="money-flow-inspector"
      className="absolute inset-y-4 right-4 z-20 w-80 overflow-y-auto overscroll-contain rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xl shadow-black/5"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-card/95 px-5 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              presentation.accent
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground">
              Saved changes update totals.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <X />
        </Button>
      </div>
      <div className="p-5">{content}</div>
    </aside>
  );
}
