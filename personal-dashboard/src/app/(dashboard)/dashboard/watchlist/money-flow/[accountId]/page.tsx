import type { Metadata } from "next";
import { PlannerCanvasPage } from "@/features/money-flow/planner/components/planner-canvas-page";

export const metadata: Metadata = {
  title: "Account workspace | Personal Dashboard",
};

export default async function AccountWorkspaceRoute({
  params,
}: Readonly<{
  params: Promise<{ accountId: string }>;
}>) {
  const { accountId } = await params;
  return <PlannerCanvasPage accountId={accountId} />;
}
