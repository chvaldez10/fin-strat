import type { ActivityCategory, ActivityKind } from "../activity";
import type { ActivityEntry, ImportedActivity } from "../activity-data";
import type { ActivityCanvasView } from "../activity-projection";
import type { Payment } from "../types";

export type ActivityListView = "recorded" | "review" | "scheduled";

export type ActivityDraft = {
  kind?: ActivityKind;
  accountId?: string;
  category?: ActivityCategory;
  entry?: ActivityEntry;
  planned?: Payment;
  imported?: ImportedActivity;
};

export type ActivityFilter = {
  type?: "income" | "spending" | "savings" | "used" | "transfers";
  categoryId?: string;
  accountId?: string;
  paymentGroup?: Readonly<{
    id: string;
    name: string;
    paymentIds: readonly string[];
  }>;
};

export type ActivityListPanel = {
  kind: "list";
  view: ActivityListView;
  filter?: ActivityFilter;
  notice?: string;
  hideAccountCard?: () => void;
};
export type ActivityPanel =
  | ActivityListPanel
  | { kind: "entry"; draft: ActivityDraft; back?: ActivityListPanel }
  | { kind: "delete-entry"; entry: ActivityEntry; back?: ActivityListPanel }
  | {
      kind: "hide-card" | "remove-category";
      name: string;
      from: ActivityCanvasView;
      hide: () => void;
      back?: ActivityListPanel;
    }
  | { kind: "delete-scheduled"; payment: Payment; back?: ActivityListPanel }
  | { kind: "import"; back?: ActivityListPanel }
  | { kind: "review"; row: ImportedActivity; back?: ActivityListPanel }
  | { kind: "plan"; categoryId?: string }
  | { kind: "add-element" }
  | { kind: "income" }
  | { kind: "account"; accountId?: string; back?: ActivityListPanel }
  | { kind: "scheduled-payment"; payment: Payment; back: ActivityListPanel };

export const reviewList: ActivityListPanel = { kind: "list", view: "review" };
export const activityViewNames: Record<ActivityCanvasView, string> = {
  overview: "Monthly overview",
  expenses: "Expenses",
  savings: "Savings",
};
