"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { formatMoney } from "../../calculations";
import { matchesStatement } from "../activity";
import type { ActivityData, ImportedActivity } from "../activity-data";
import { FormError, PlannerSheet, usePlannerAction } from "./planner-form";
import { useCanvasWriteContext } from "./planner-write-context";

export function ActivityImportReview({
  row,
  data,
  accountName,
  onClose,
  onLog,
  onDone,
}: Readonly<{
  row: ImportedActivity;
  data: ActivityData;
  accountName: string;
  onClose: () => void;
  onLog: () => void;
  onDone: () => void;
}>) {
  const [confirmIgnore, setConfirmIgnore] = useState(false);
  const save = useMutation(api.plannerActivity.reviewImport);
  const action = usePlannerAction();
  const canvas = useCanvasWriteContext();
  const candidates = data.entries.filter(
    (entry) =>
      matchesStatement(entry, row) &&
      !data.matches.some(
        (match) =>
          match.entryId === entry._id && match.accountId === row.accountId
      )
  );
  return (
    <PlannerSheet
      title="Review transaction"
      description={`${row.date} · ${accountName}`}
      onClose={onClose}
      pending={action.busy}
    >
      <div className="space-y-4">
        <div className="rounded-xl border p-4">
          <p className="break-words text-sm">{row.description}</p>
          <p className="mt-1 text-lg font-semibold">
            {formatMoney(row.amountCents)}{" "}
            {row.direction === "out" ? "out" : "in"}
          </p>
        </div>
        {!!candidates.length && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Already recorded?</p>
            <p className="text-xs text-muted-foreground">
              Match one of these transactions with the same date and amount.
            </p>
            {candidates.map((entry) => (
              <Button
                key={entry._id}
                variant="outline"
                className="h-auto min-h-10 w-full justify-start whitespace-normal text-left"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () =>
                      save({
                        id: row._id,
                        entryId: entry._id,
                        canvas: canvas?.identity,
                      }),
                    onDone
                  )
                }
              >
                Match {entry.description}
              </Button>
            ))}
          </div>
        )}
        <FormError message={action.error} />
        <div className="flex flex-wrap gap-2">
          <Button disabled={action.busy} onClick={onLog}>
            Categorize and log
          </Button>
          {confirmIgnore ? (
            <Button
              variant="outline"
              disabled={action.busy}
              onClick={() =>
                void action.run(
                  () =>
                    save({
                      id: row._id,
                      entryId: null,
                      canvas: canvas?.identity,
                    }),
                  onDone
                )
              }
            >
              Confirm ignore
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={action.busy}
              onClick={() => setConfirmIgnore(true)}
            >
              Ignore…
            </Button>
          )}
        </div>
      </div>
    </PlannerSheet>
  );
}
