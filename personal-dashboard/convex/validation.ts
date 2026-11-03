import { ConvexError, type Infer } from "convex/values";
import { decodeStoredMoneyFlowDocument } from "../src/features/money-flow/persistence/document-codec";
import { isYearMonth, monthsBetween } from "../src/features/money-flow/months";
import type {
  MoneyFlowAccountWorkspace,
  MoneyFlowDocument,
  MoneyFlowScenario,
} from "../src/features/money-flow/types";
import { workspace } from "./schema";

export const MAX_ACCOUNTS = 25;
export function boundedText(value: string, label: string, max = 120) {
  const text = value.trim();
  if (!text || text.length > max)
    throw new ConvexError(`${label} must contain 1-${max} characters.`);
  return text;
}
export function validateScenario(value: {
  name: string;
  startMonth: string;
  forecastMonthCount: number;
}): asserts value is MoneyFlowScenario {
  boundedText(value.name, "Scenario name");
  if (
    !isYearMonth(value.startMonth) ||
    !Number.isInteger(value.forecastMonthCount) ||
    value.forecastMonthCount < 1 ||
    value.forecastMonthCount > 1200
  )
    throw new ConvexError(
      "Choose a valid start month and 1-1200 forecast months."
    );
}
export function validateAccount(
  value: Infer<typeof workspace> | MoneyFlowAccountWorkspace,
  scenario: MoneyFlowScenario
) {
  boundedText(value.id, "Account identifier");
  boundedText(value.name, "Account name");
  boundedText(value.institution, "Institution");
  if (
    value.nodes.length > 100 ||
    value.transfers.length > 300 ||
    new TextEncoder().encode(JSON.stringify(value)).length > 128000
  )
    throw new ConvexError(
      "This workspace exceeds the supported size (100 nodes, 300 transfers, 128 KB)."
    );
  for (const node of value.nodes) {
    boundedText(node.id, "Node identifier");
    boundedText(node.label, "Node label");
    if (node.note && node.note.length > 2000)
      throw new ConvexError("Notes must be at most 2000 characters.");
  }
  for (const transfer of value.transfers) {
    boundedText(transfer.id, "Transfer identifier");
    if (transfer.label && transfer.label.length > 120)
      throw new ConvexError("Transfer labels must be at most 120 characters.");
    if (Object.keys(transfer.monthOverrides ?? {}).length > 1200)
      throw new ConvexError("Too many monthly overrides.");
  }
  const candidate = {
    id: "validation",
    userId: "validation",
    version: 4,
    currency: "CAD",
    scenario,
    accounts: [value],
    view: {
      selectedMonth: scenario.startMonth,
      selectedAccountId: value.id,
      mode: "canvas",
    },
  };
  if (!decodeStoredMoneyFlowDocument(candidate, "validation"))
    throw new ConvexError(
      "The workspace contains invalid balances, dates, nodes, or connections."
    );
}
export function storedAccount(
  value: MoneyFlowAccountWorkspace | Infer<typeof workspace>
): Infer<typeof workspace> {
  return JSON.parse(JSON.stringify(value)) as Infer<typeof workspace>;
}
export function validateView(
  value: { selectedMonth: string },
  scenario: MoneyFlowScenario
) {
  if (
    !isYearMonth(value.selectedMonth) ||
    monthsBetween(scenario.startMonth, value.selectedMonth) < 0 ||
    monthsBetween(scenario.startMonth, value.selectedMonth) >=
      scenario.forecastMonthCount
  )
    throw new ConvexError("Select a month inside the forecast.");
}
export function validateImport(
  raw: unknown,
  ownerId: string
): MoneyFlowDocument {
  if (
    !raw ||
    typeof raw !== "object" ||
    new TextEncoder().encode(JSON.stringify(raw)).length > 800000
  )
    throw new ConvexError("The import is invalid or exceeds 800 KB.");
  const document = decodeStoredMoneyFlowDocument(
    { ...raw, userId: ownerId },
    ownerId
  );
  if (!document || document.accounts.length > MAX_ACCOUNTS)
    throw new ConvexError(
      "The saved plan could not be validated or has too many accounts."
    );
  validateScenario(document.scenario);
  for (const account of document.accounts)
    validateAccount(account, document.scenario);
  for (const account of document.accounts)
    for (const transfer of account.transfers) {
      if (!transfer.linkedTransferId) continue;
      const counterpart = document.accounts
        .find((a) => a.id === transfer.counterpartyAccountId)
        ?.transfers.filter(
          (t) =>
            t.linkedTransferId === transfer.linkedTransferId &&
            t.counterpartyAccountId === account.id
        );
      if (
        counterpart?.length !== 1 ||
        financialSchedule(counterpart[0]) !== financialSchedule(transfer)
      )
        throw new ConvexError(
          "Linked transfers disagree between accounts. Keep your backup and repair the pair before importing."
        );
    }
  return document;
}
export function financialSchedule(
  transfer: MoneyFlowAccountWorkspace["transfers"][number]
) {
  return JSON.stringify([
    transfer.baseMonthlyAmountCents,
    transfer.startMonth,
    transfer.endMonth ?? null,
    transfer.startDate ?? null,
    transfer.endDate ?? null,
    Object.entries(transfer.monthOverrides ?? {}).sort(([a], [b]) =>
      a.localeCompare(b)
    ),
  ]);
}
