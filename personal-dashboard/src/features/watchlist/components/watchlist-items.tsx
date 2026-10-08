import Link from "next/link";
import { Button } from "@/components/ui/button";

const watchItems = [
  {
    title: "Subscriptions",
    detail: "Spotify, iCloud, gym, cloud storage",
    status: "Review by Jun 20",
  },
  {
    title: "Money flow",
    detail: "Map monthly income and expenses through Chequing",
    status: "Open canvas",
    href: "/dashboard/watchlist/money-flow",
  },
  {
    title: "Research",
    detail: "High-yield savings options and fee notes",
    status: "2 saved links",
  },
  {
    title: "Receipts",
    detail: "Laptop stand, bike tune-up, kitchen scale",
    status: "Needs filing",
  },
];

export function WatchlistItems() {
  return (
    <div className="grid min-w-0 gap-4">
      {watchItems.map((item) => (
        <div
          key={item.title}
          className="grid min-w-0 gap-3 rounded-lg border border-border bg-card p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
        >
          <div className="min-w-0">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              {item.detail}
            </p>
          </div>
          {item.href ? (
            <Button asChild size="sm" variant="outline">
              <Link href={item.href}>{item.status}</Link>
            </Button>
          ) : (
            <span className="max-w-full justify-self-start rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground md:justify-self-end">
              {item.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
