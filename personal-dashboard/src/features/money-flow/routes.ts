export const MONEY_PATH = "/dashboard/watchlist/money-flow";

export function monthLink(path: string, month: string) {
  return month ? `${path}?month=${encodeURIComponent(month)}` : path;
}
