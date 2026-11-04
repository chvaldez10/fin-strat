import type { FunctionArgs, FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import type {
  MoneyFlowPlan,
  MoneyFlowAccountSummary,
  MoneyFlowWorkspaceSnapshot,
} from "./convex-types";
import {
  withWorkspaceAccess,
  type WorkspaceWriteAccess,
} from "./workspace-write-access";

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export class WorkspaceWriter {
  private revisions: Record<string, number> = {};
  constructor(
    private root: MoneyFlowPlan,
    accounts: MoneyFlowAccountSummary[],
    private save: (
      args: FunctionArgs<typeof api.moneyFlow.saveWorkspace>
    ) => Promise<FunctionReturnType<typeof api.moneyFlow.saveWorkspace>>,
    private access: WorkspaceWriteAccess
  ) {
    this.configure(root, accounts, save, access);
  }
  configure(
    root: MoneyFlowPlan,
    accounts: MoneyFlowAccountSummary[],
    save: WorkspaceWriter["save"],
    access: WorkspaceWriteAccess
  ) {
    this.root = root;
    this.save = save;
    this.access = access;
    for (const account of accounts)
      this.revisions[account.id] = Math.max(
        this.revisions[account.id] ?? 0,
        account.revision
      );
  }
  async write(
    workspace: MoneyFlowWorkspaceSnapshot["workspace"],
    revision: number
  ) {
    const result = await withWorkspaceAccess(this.access, () =>
      this.save({
        documentId: this.root._id,
        accountId: workspace.id,
        sessionId: this.access.sessionId,
        expectedRevision: revision,
        counterpartRevisions: this.revisions,
        workspace: clean(workspace),
      })
    );
    if (result.status === "saved")
      Object.assign(this.revisions, result.counterpartRevisions);
    return result;
  }
}
