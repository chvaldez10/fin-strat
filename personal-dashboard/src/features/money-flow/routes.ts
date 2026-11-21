export const MONEY_PATH = "/dashboard/watchlist/money-flow";

export const moneyPages = [
  { key: "canvas", label: "Activity", suffix: "" },
  { key: "month", label: "Monthly plan", suffix: "/planner" },
  { key: "recurring", label: "Recurring payments", suffix: "/recurring" },
  { key: "subscriptions", label: "Subscriptions", suffix: "/subscriptions" },
  { key: "accounts", label: "Accounts", suffix: "/accounts" },
] as const;

export type MoneyPage = (typeof moneyPages)[number]["key"];

export function moneyPageForPathname(pathname: string): MoneyPage {
  const segment = pathname.slice(MONEY_PATH.length).split("/")[1];
  return (
    moneyPages.find((item) => item.suffix === `/${segment}`)?.key ?? "canvas"
  );
}

export function moneyBreadcrumbLabel(path: string): string | undefined {
  if (!path.startsWith(`${MONEY_PATH}/`)) return;
  const [section, account, ...rest] = path
    .slice(MONEY_PATH.length + 1)
    .split("/");
  if (section === "accounts" && account && rest.length === 0) return "Account";
  if (account !== undefined) return;
  if (section === "upcoming") return "Scheduled canvas";
  return (
    moneyPages.find((item) => item.suffix === `/${section}`)?.label ??
    "Monthly canvas"
  );
}

export function monthLink(path: string, month: string, account?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (account) params.set("account", account);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
