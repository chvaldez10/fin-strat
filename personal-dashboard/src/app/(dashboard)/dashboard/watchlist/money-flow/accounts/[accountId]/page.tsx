import type { Metadata } from "next";
import { AccountDetailsPage } from "@/features/money-flow/planner/components/account-details-page";
export const metadata: Metadata = {
  title: "Account details | Personal Dashboard",
};
export default async function Page({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <AccountDetailsPage accountId={accountId} />;
}
