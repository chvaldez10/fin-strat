"use client";

import { useState, type ReactNode } from "react";
import { useConvex, useMutation } from "convex/react";
import { EyeOff } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "../../calculations";
import type { ActivityData } from "../activity-data";
import type { ActivitySummary } from "../activity-projection";
import {
  DEFAULT_CATEGORIES,
  type ActivityCategory,
  type CategoryKind,
} from "../activity";
import { ActivitySelect } from "./activity-select";
import { CanvasInspector } from "../../components/canvas-inspector";
import { FormError, PlannerSheet, usePlannerAction } from "./planner-form";
import { MoneyField as Field } from "../../components/money-field";
import { amountText, amountValue } from "../../amounts";
import { useCanvasWriteContext } from "./planner-write-context";

const spendingLimit = "monthly-limit";
const newCategory = "new-category";
const commonCategoryIds = new Set(
  DEFAULT_CATEGORIES.map((category) => category.id)
);

export function ActivityPlanEditor({
  month,
  data,
  bucket,
  add,
  beforeForm,
  presentation = "sheet",
  onHide,
  onClose,
  onLog,
  onView,
}: Readonly<{
  month: string;
  data: ActivityData;
  bucket?: ActivitySummary["buckets"][number];
  add?: Readonly<{
    kind?: CategoryKind;
    onPlace: (category: ActivityCategory) => void;
  }>;
  beforeForm?: ReactNode;
  presentation?: "canvas" | "sheet";
  onHide?: () => void;
  onClose: () => void;
  onLog?: (category: ActivityCategory) => void;
  onView: (category: ActivityCategory) => void;
}>) {
  const [choice, setChoice] = useState(
    bucket?.id ?? (add ? newCategory : spendingLimit)
  );
  const [amount, setAmount] = useState(
    amountText(
      bucket
        ? bucket.planned
        : add
          ? null
          : (data.plan?.spendingLimitCents ?? null)
    )
  );
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>(add?.kind ?? "expense");
  const [revision] = useState(data.plan?.revision ?? 0);
  const save = useMutation(api.plannerActivity.saveMonth);
  const convex = useConvex();
  const canvas = useCanvasWriteContext();
  const action = usePlannerAction();
  const chosen = bucket ?? data.categories.find((item) => item.id === choice);
  const amountLabel =
    choice === spendingLimit ? "Spending limit (CAD)" : "Set aside (CAD)";
  const custom = { id: newCategory, name: "New category" };
  const categories = data.categories.filter(
    (category) => !add?.kind || category.kind === add.kind
  );
  const options = add
    ? [custom]
    : [
        { id: spendingLimit, name: "Overall spending limit" },
        ...categories,
        custom,
      ];
  const groups = add
    ? [
        {
          label: "Your categories",
          options: categories.filter((item) => !commonCategoryIds.has(item.id)),
        },
        {
          label: "Common categories",
          options: categories.filter((item) => commonCategoryIds.has(item.id)),
        },
      ]
    : undefined;
  const Container = presentation === "canvas" ? CanvasInspector : PlannerSheet;
  return (
    <Container
      title={bucket?.name ?? (add ? "Add element" : "Monthly amounts")}
      description={
        add
          ? "Choose an existing category or create your own."
          : `Edit amounts for ${month}. Leave an amount blank to clear it.`
      }
      onClose={onClose}
      pending={action.busy}
    >
      {bucket && (
        <div className="mb-5 space-y-3 rounded-xl border p-4">
          <p className="text-lg font-semibold">
            {formatMoney(bucket.actual)}{" "}
            {bucket.kind === "savings" ? "contributed" : "spent"}
          </p>
          {bucket.planned !== null && (
            <p className="text-sm text-muted-foreground">
              {formatMoney(bucket.planned)} set aside ·{" "}
              {formatMoney(Math.abs(bucket.planned - bucket.actual))}{" "}
              {bucket.actual > bucket.planned ? "over" : "left"}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {onLog && (
              <Button size="sm" onClick={() => onLog(bucket)}>
                {bucket.kind === "savings" ? "Log contribution" : "Log expense"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onView(bucket)}>
              View activity
            </Button>
            {onHide && (
              <Button
                size="sm"
                variant="outline"
                disabled={action.busy}
                onClick={onHide}
              >
                <EyeOff aria-hidden="true" /> Hide card…
              </Button>
            )}
          </div>
        </div>
      )}
      {beforeForm}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(async () => {
            const amountCents = amountValue(amount);
            const matchesName = (category: ActivityCategory) =>
              category.name.toLowerCase() === name.trim().toLowerCase() &&
              category.kind === kind;
            const existing =
              chosen ??
              (add && choice === newCategory
                ? data.categories.find(matchesName)
                : undefined);
            const change =
              choice === spendingLimit
                ? { field: "spendingLimit" as const, amountCents }
                : choice === newCategory && !existing
                  ? { field: "newAllocation" as const, name, kind, amountCents }
                  : {
                      field: "allocation" as const,
                      categoryId: existing?.id ?? choice,
                      amountCents,
                    };
            if (
              !add ||
              !existing ||
              (amountCents !== null &&
                data.plan?.allocations[existing.id] !== amountCents)
            )
              await save({
                month,
                change,
                expectedRevision: revision,
                canvas: canvas?.identity,
              });
            if (add) {
              const category =
                existing ??
                (
                  await convex.query(api.plannerActivity.getMonth, { month })
                ).categories.find(matchesName);
              if (!category)
                throw new Error(
                  "The category could not be loaded. Select it from the list to place it."
                );
              add.onPlace(category);
            }
          }, onClose);
        }}
      >
        <fieldset disabled={action.busy} className="space-y-4">
          <legend className="sr-only">Monthly amount</legend>
          {!bucket && (
            <ActivitySelect
              label={add ? "Category" : "Amount for"}
              value={choice}
              options={options}
              groups={groups}
              onChange={(value) => {
                setChoice(value);
                setAmount(
                  amountText(
                    value === spendingLimit
                      ? (data.plan?.spendingLimitCents ?? null)
                      : (data.plan?.allocations[value] ?? null)
                  )
                );
              }}
            />
          )}
          {choice === newCategory && (
            <>
              <Field label="Category name">
                <Input
                  aria-label="Category name"
                  value={name}
                  maxLength={60}
                  required
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              {!add?.kind && (
                <ActivitySelect
                  label="Category type"
                  value={kind}
                  onChange={(value) => setKind(value as CategoryKind)}
                  options={[
                    { id: "expense", name: "Spending" },
                    { id: "savings", name: "Savings" },
                  ]}
                />
              )}
            </>
          )}
          <Field label={amountLabel}>
            <Input
              aria-label={amountLabel}
              value={amount}
              inputMode="decimal"
              placeholder="Optional"
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <FormError message={action.error} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit">
              {action.busy
                ? "Saving…"
                : add
                  ? "Add element"
                  : "Save monthly amount"}
            </Button>
            {!bucket && chosen && onLog && (
              <Button variant="outline" onClick={() => onLog(chosen)}>
                Log activity
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </Container>
  );
}
