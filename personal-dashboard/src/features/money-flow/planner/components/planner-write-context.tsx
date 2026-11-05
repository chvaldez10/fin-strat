"use client";
import { createContext, useContext } from "react";
import type { Id } from "@convex/_generated/dataModel";
import type { WorkspaceWriteAccess } from "../../persistence/workspace-write-access";
export type CanvasWriteContext = {
  identity: {
    documentId: Id<"moneyFlowDocuments">;
    accountId: string;
    sessionId: string;
  };
  access: WorkspaceWriteAccess;
};
export const PlannerWriteContext = createContext<
  CanvasWriteContext | undefined
>(undefined);
export function useCanvasWriteContext() {
  return useContext(PlannerWriteContext);
}
