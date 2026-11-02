import type { Metadata } from "next";
import { AccountWorkspacePage } from "@/features/money-flow/components/workspace/account-workspace-page";

export const metadata: Metadata = {
  title: "Account workspace | Personal Dashboard",
};

export default async function AccountWorkspaceRoute({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return (
    <div className="-m-4 min-w-0 overflow-hidden md:-m-6">
      <h1 className="sr-only">Bank account cash-flow workspace</h1>
      <AccountWorkspacePage accountId={accountId} />
    </div>
  );
}
