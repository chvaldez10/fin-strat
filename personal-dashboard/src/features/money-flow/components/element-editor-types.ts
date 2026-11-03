import type { MoneyCanvasNode } from "../canvas-types";
import type { DateOnly } from "@/lib/date-only";

export type ElementScheduleValues = { startDate: DateOnly; endDate?: DateOnly };

export type SelectedMoneyElement = {
  type: "node";
  item: MoneyCanvasNode;
} | null;
export type ElementTransferValues = ElementScheduleValues & {
  label: string;
  baseMonthlyAmountCents: number;
  monthOverrideCents: number | null;
};
export type ElementEditValues = {
  label: string;
  note: string;
  startingBalanceCents?: number;
  flow?: ElementTransferValues & { transferId?: string };
};
