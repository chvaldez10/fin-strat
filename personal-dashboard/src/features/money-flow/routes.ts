export const MONEY_PATH = "/dashboard/watchlist/money-flow";

export function monthLink(path: string, month: string, account?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (account) params.set("account", account);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
