import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormSection, SearchInput } from "@/components/patterns";

export default function AnalyticsPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Watchlist</h1>
        <p className="mt-2 text-muted-foreground">
          Money notes, saved research, and small things worth checking later.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <FormSection
          title="Quick search"
          description="Find the thing you half-remember saving."
        >
          <div className="space-y-3">
            <SearchInput placeholder="Search notes, bills, ideas..." />
            <Button className="w-full">Search dashboard</Button>
          </div>
        </FormSection>
        <FormSection
          title="Quick capture"
          description="Drop in a loose item and sort it later."
        >
          <div className="space-y-3">
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Example: compare annual travel insurance plans"
            />
            <Button className="w-full">Save note</Button>
          </div>
        </FormSection>
      </div>
      <div className="grid gap-4">
        {watchItems.map((item) => (
          <div
            key={item.title}
            className="grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.detail}
              </p>
            </div>
            {item.href ? (
              <Button asChild size="sm" variant="outline">
                <Link href={item.href}>{item.status}</Link>
              </Button>
            ) : (
              <span className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">
                {item.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
