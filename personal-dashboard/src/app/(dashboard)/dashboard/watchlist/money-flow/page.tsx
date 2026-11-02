import type { Metadata } from "next";
import { PersistedWorkspace } from "@/features/money-flow/components/workspace/persisted-workspace";

export const metadata: Metadata = {
  title: "Money Flow | Personal Dashboard",
  description:
    "An interactive monthly cash-flow canvas centered on your chequing account.",
};

export default function MoneyFlowPage() {
  return (
    <div className="-m-4 min-w-0 overflow-hidden md:-m-6">
      <h1 className="sr-only">Interactive money flow</h1>
      <PersistedWorkspace />
    </div>
  );
}
