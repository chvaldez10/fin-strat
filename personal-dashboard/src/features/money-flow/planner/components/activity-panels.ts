import type { ActivityCategory, ActivityKind } from "../activity";
import type {
  ActivityEntry,
  ActivityFilter,
  ImportedActivity,
} from "../activity-data";
import type { Payment } from "../types";

export type ActivityListView = "recorded" | "review" | "scheduled";

export type ActivityDraft = {
  kind?: ActivityKind;
  accountId?: string;
  destinationId?: string;
  category?: ActivityCategory;
  entry?: ActivityEntry;
  planned?: Payment;
  imported?: ImportedActivity;
};

export type ActivityListPanel = {
  kind: "list";
  view: ActivityListView;
  filter?: ActivityFilter;
  notice?: string;
};
export type ActivityPanel =
  | ActivityListPanel
  | { kind: "entry"; draft: ActivityDraft; back?: ActivityListPanel }
  | { kind: "delete-entry"; entry: ActivityEntry; back?: ActivityListPanel }
  | { kind: "delete-scheduled"; payment: Payment; back?: ActivityListPanel }
  | { kind: "import"; back?: ActivityListPanel }
  | { kind: "review"; row: ImportedActivity; back?: ActivityListPanel }
  | { kind: "plan"; categoryId?: string }
  | { kind: "account"; accountId?: string; back?: ActivityListPanel }
  | { kind: "scheduled-payment"; payment: Payment; back: ActivityListPanel };

export const reviewList: ActivityListPanel = { kind: "list", view: "review" };
