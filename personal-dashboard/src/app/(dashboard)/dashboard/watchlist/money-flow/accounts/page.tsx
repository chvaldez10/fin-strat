import type { Metadata } from "next";
import { AccountsPage } from "@/features/money-flow/planner/components/accounts-page";
export const metadata: Metadata = {
  title: "Money accounts | Personal Dashboard",
};
export default function Page() {
  return <AccountsPage />;
}
