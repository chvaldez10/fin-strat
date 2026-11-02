"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { useMoneyFlowPlan } from "../../persistence/use-money-flow-plan";
import { MoneyFlowLoading } from "./money-flow-loading";
import { WorkspaceSession } from "./workspace-session";

export function AccountWorkspacePage({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { root, accounts, isLoading } = useMoneyFlowPlan();
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const workspace = useQuery(
    api.moneyFlow.getWorkspace,
    root && selectedAccount
      ? { documentId: root._id, accountId: selectedAccount.id }
      : "skip"
  );
  if (isLoading || (selectedAccount && !workspace)) return <MoneyFlowLoading />;
  if (!root || !selectedAccount || !workspace)
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          title="Bank account unavailable"
          description="Choose an account from your bank accounts list to open its workspace."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/watchlist/money-flow">
                Back to bank accounts
              </Link>
            </Button>
          }
        />
      </div>
    );
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden">
      <WorkspaceSession
        key={accountId}
        root={root}
        accounts={accounts}
        server={workspace}
        onSwitch={(id) =>
          router.push(
            `/dashboard/watchlist/money-flow/${encodeURIComponent(id)}`
          )
        }
        onBack={() => router.push("/dashboard/watchlist/money-flow")}
      />
    </div>
  );
}
