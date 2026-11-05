"use client";

import { Button } from "@/components/ui/button";
import type { MoneyFlowTransfer, YearMonth } from "../types";
import type { ElementTransferValues } from "./element-editor-types";
import { ElementFlowFields, useElementFlow } from "./element-flow-fields";
import { ElementSaveFeedback, useElementSave } from "./element-form-feedback";

export function ElementTransferForm({
  transfer,
  selectedMonth,
  onSave,
  onRemove,
}: Readonly<{
  transfer: MoneyFlowTransfer;
  selectedMonth: YearMonth;
  onSave: (id: string, values: ElementTransferValues) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}>) {
  const flow = useElementFlow(transfer, selectedMonth);
  const save = useElementSave();
  return (
    <form
      aria-busy={save.state === "saving"}
      onChange={save.reset}
      onSubmit={async (event) => {
        event.preventDefault();
        if (save.state === "saving") return;
        const values = flow.validate();
        if (values) await save.submit(() => onSave(transfer.id, values));
      }}
    >
      <fieldset
        disabled={save.state === "saving"}
        className="min-w-0 space-y-5"
      >
        <legend className="sr-only">Element connection details</legend>
        <ElementFlowFields
          flow={flow}
          idPrefix={`connection-${transfer.id}`}
          amountLabel="Recurring monthly amount"
          month={selectedMonth}
          disabled={save.state === "saving"}
          onChange={save.reset}
        />
        <ElementSaveFeedback
          state={save.state}
          label="Save connection"
          confirmation="Connection saved."
        />
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => void save.submit(onRemove)}
        >
          Remove connection
        </Button>
      </fieldset>
    </form>
  );
}
