import type { FinancialAccount } from "./types";

export const ALL_ACCOUNTS = "all";

export function activityCanvasBanks(accounts: readonly FinancialAccount[]) {
  return accounts.filter(
    (account) => account.kind !== "credit" && account.legacyAccountId
  );
}

export function activityCanvasBank(
  banks: readonly FinancialAccount[],
  selection: string,
  preferred?: string
) {
  if (selection === ALL_ACCOUNTS) return undefined;
  return (
    banks.find(
      (account) => account.legacyAccountId === (selection || preferred)
    ) ??
    banks.find((account) => account.kind === "chequing") ??
    banks[0]
  );
}

export function bankWorkspaceName(
  bank?: Pick<FinancialAccount, "name" | "institution">
) {
  if (!bank) return "All accounts";
  return bank.institution &&
    !bank.name.toLowerCase().includes(bank.institution.toLowerCase())
    ? `${bank.name} (${bank.institution})`
    : bank.name;
}
