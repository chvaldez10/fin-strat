import type { MoneyCanvasNode } from "../canvas-types";
import type { FinancialAccount, Payment } from "./types";
import { formatMoney } from "../calculations";
import type { PlannerEdge } from "./components/planner-element-connection";

export function projectMonthlyCanvas(
  account: FinancialAccount,
  payments: Payment[],
  positions: Record<string, { x: number; y: number }>
) {
  const groups = new Map<string, Payment[]>();
  for (const item of payments.filter(
    (p) => p.accountId === account.id && p.status !== "skipped"
  )) {
    const key = item.seriesId ?? item._id;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  let left = 0,
    right = 0;
  const occupied = Object.values(positions);
  function place(income: boolean) {
    let x = income ? 60 : 940,
      y = 60 + (income ? left++ : right++) * 240;
    while (
      y > 1000 ||
      occupied.some(
        (point) => Math.abs(point.x - x) < 320 && Math.abs(point.y - y) < 220
      )
    ) {
      y += 240;
      if (y > 1000) {
        x += income ? -340 : 340;
        y = 60;
      }
    }
    const position = { x, y };
    occupied.push(position);
    return position;
  }
  const nodes: MoneyCanvasNode[] = [
    {
      id: "center",
      type: "chequing",
      position: positions.center ?? { x: 480, y: 240 },
      data: {
        kind: "chequing",
        label: account.name,
        note: `${formatMoney(account.balanceCents)} recorded balance. ${account.balanceUpdatedAt ? "Manually updated." : "Imported opening balance · not verified."}`,
      },
    },
  ];
  const edges: PlannerEdge[] = [];
  for (const [id, items] of groups) {
    const first = items[0],
      income = first.kind === "income",
      unknown = items.some((item) => item.amountCents === null),
      amount = unknown
        ? null
        : items.reduce((sum, item) => sum + (item.amountCents ?? 0), 0);
    const kind = income
      ? "income"
      : first.kind === "savings" || first.kind === "transfer"
        ? "account"
        : "expense";
    nodes.push({
      id,
      type: kind,
      position: positions[id] ?? place(income),
      data: {
        kind,
        label: first.name,
        monthlyAmountCents: amount ?? undefined,
        note: `${first.kind === "cardPayment" ? "Credit card repayment · " : first.isSubscription ? "Subscription · " : first.kind === "expense" && first.seriesId ? "Recurring payment · " : ""}${items.length} scheduled payment${items.length === 1 ? "" : "s"}. Click to edit.`,
      },
    });
    edges.push({
      id: `edge-${id}`,
      source: income ? id : "center",
      target: income ? "center" : id,
      type: "planner",
      selectable: false,
      focusable: false,
      reconnectable: false,
      deletable: false,
      data: { amount, kind },
    });
  }
  return { nodes, edges, groups };
}
