export type PaymentKind =
  "income" | "expense" | "savings" | "transfer" | "cardPayment";
export type Frequency =
  "once" | "weekly" | "fortnightly" | "twiceMonthly" | "monthly" | "yearly";
export type AccountKind = "chequing" | "savings" | "credit";
export type Schedule = {
  seriesId: string;
  name: string;
  kind: PaymentKind;
  isSubscription: boolean;
  amountCents: number | null;
  estimated: boolean;
  accountId: string | null;
  counterpartyId: string | null;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  secondDay: number | null;
  notes: string;
  status: "active" | "paused" | "cancelled";
  effectiveFrom: string;
  effectiveTo: string | null;
  monthOverrides?: Record<string, number | null>;
};
export type PaymentValues = Pick<
  Schedule,
  | "name"
  | "kind"
  | "isSubscription"
  | "amountCents"
  | "estimated"
  | "accountId"
  | "counterpartyId"
  | "notes"
> & {
  dueDate: string;
  statementMonth: string | null;
  statementAmountCents: number | null;
};
export type Payment = PaymentValues & {
  _id: string;
  seriesId: string | null;
  month: string;
  originalDate: string;
  status: "pending" | "paid" | "skipped";
  paidOn: string | null;
  revision: number;
  carryForward: boolean;
  modified: boolean;
};
export type FinancialAccount = {
  _id: string;
  id: string;
  name: string;
  institution: string;
  kind: AccountKind;
  balanceCents: number;
  balanceUpdatedAt: number | null;
  legacyAccountId: string | null;
  revision: number;
};
