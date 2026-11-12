import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";

export type ActivityData = FunctionReturnType<
  typeof api.plannerActivity.getMonth
>;
export type ActivityEntry = ActivityData["entries"][number];
export type ImportedActivity = ActivityData["pending"][number];
