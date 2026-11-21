import type { FinancialAccount } from "./types";

export const ALL_ACCOUNTS = "all";

export function activityAccountKey(account: FinancialAccount) {
  return account.legacyAccountId ?? account.id;
}

export function activityCanvasAccount(
  accounts: readonly FinancialAccount[],
  selection: string,
  preferred?: string
) {
  if (selection === ALL_ACCOUNTS) return undefined;
  return (
    accounts.find(
      (account) => activityAccountKey(account) === (selection || preferred)
    ) ??
    accounts.find((account) => account.kind === "chequing") ??
    accounts[0]
  );
}

export function activityAccountName(
  account?: Pick<FinancialAccount, "name" | "institution">
) {
  if (!account) return "All accounts";
  return account.institution &&
    !account.name.toLowerCase().includes(account.institution.toLowerCase())
    ? `${account.name} (${account.institution})`
    : account.name;
}
