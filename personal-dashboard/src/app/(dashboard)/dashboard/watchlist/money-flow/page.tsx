import type { Metadata } from "next";
import { BankAccountsPage } from "@/features/money-flow/components/workspace/bank-accounts-page";

export const metadata: Metadata = {
  title: "Money Flow | Personal Dashboard",
  description: "Your bank accounts and their monthly cash-flow workspaces.",
};

export default function MoneyFlowPage() {
  return (
    <div className="-m-4 min-w-0 overflow-hidden md:-m-6">
      <BankAccountsPage />
    </div>
  );
}
