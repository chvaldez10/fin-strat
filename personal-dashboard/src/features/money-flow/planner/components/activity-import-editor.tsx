"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "../../calculations";
import { parseActivityCsv } from "../activity-csv";
import type { FinancialAccount } from "../types";
import { ActivitySelect } from "./activity-select";
import {
  Field,
  FormError,
  PlannerSheet,
  localToday,
  usePlannerAction,
} from "./planner-form";
import { useCanvasWriteContext } from "./planner-write-context";

export function ActivityImportEditor({
  month,
  accounts,
  onClose,
  onImported,
}: Readonly<{
  month: string;
  accounts: FinancialAccount[];
  onClose: () => void;
  onImported: (result: { added: number; duplicates: number }) => void;
}>) {
  const [accountId, setAccount] = useState(accounts[0]?.id ?? "");
  const [outflowSign, setSign] = useState<"negative" | "positive">("negative");
  const [csv, setCsv] = useState("");
  const [fileError, setFileError] = useState("");
  const action = usePlannerAction();
  const canvas = useCanvasWriteContext();
  const save = useMutation(api.plannerActivity.importRows);
  const preview = useMemo(() => {
    if (!csv) return null;
    try {
      const parsed = parseActivityCsv(csv, month, outflowSign);
      if (parsed.rows.some((row) => row.date > localToday()))
        throw new Error("Use dates for transactions that have already posted.");
      return { parsed, error: "" };
    } catch (cause) {
      return {
        parsed: null,
        error:
          cause instanceof Error ? cause.message : "The CSV could not be read.",
      };
    }
  }, [csv, month, outflowSign]);
  return (
    <PlannerSheet
      title="Import bank or card activity"
      description="Choose a CSV from one account. Imported rows go to review before they affect your totals."
      onClose={onClose}
      pending={action.busy}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const rows = preview?.parsed?.rows;
          if (!rows || !accountId) return;
          void action.run(async () =>
            onImported(
              await save({ accountId, month, rows, canvas: canvas?.identity })
            )
          );
        }}
      >
        <fieldset disabled={action.busy} className="space-y-4">
          <legend className="sr-only">Import settings</legend>
          <ActivitySelect
            label="Statement account"
            value={accountId}
            options={accounts}
            onChange={setAccount}
          />
          <ActivitySelect
            label="Money out is shown as"
            value={outflowSign}
            onChange={(value) => setSign(value as typeof outflowSign)}
            options={[
              { id: "negative", name: "Negative amounts, e.g. −60.00" },
              { id: "positive", name: "Positive amounts, e.g. 60.00" },
            ]}
          />
          <Field label="CSV file">
            <Input
              type="file"
              accept=".csv,text/csv"
              aria-label="CSV file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                setCsv("");
                setFileError("");
                if (!file) return;
                if (file.size > 2_000_000) {
                  setFileError("Choose a CSV under 2 MB.");
                  return;
                }
                try {
                  const content = await file.text();
                  if (!content.trim()) setFileError("This file is empty.");
                  else setCsv(content);
                } catch {
                  setFileError("The file could not be opened.");
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Use Date, Description and Amount columns, with YYYY-MM-DD dates
              and signed CAD amounts.
            </p>
          </Field>
          <FormError message={fileError || preview?.error || action.error} />
          {preview?.parsed && (
            <div className="space-y-2 rounded-xl border p-3">
              <p className="text-sm font-medium">
                {preview.parsed.rows.length} rows in {month}
              </p>
              {!!preview.parsed.outsideMonth && (
                <p className="text-xs text-muted-foreground">
                  {preview.parsed.outsideMonth} rows are outside this month.
                </p>
              )}
              <ul className="space-y-2 text-sm">
                {preview.parsed.rows.slice(0, 4).map((row, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="min-w-0 break-words">
                      {row.description}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {row.direction === "out" ? "−" : "+"}
                      {formatMoney(row.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={!preview?.parsed || !accountId}
          >
            {action.busy ? "Importing…" : "Import for review"}
          </Button>
        </fieldset>
      </form>
    </PlannerSheet>
  );
}
