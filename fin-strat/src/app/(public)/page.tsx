import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  ListChecks,
  NotebookPen,
  Search,
  Target,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const dailySignals = [
    {
      label: "Money",
      value: "$420",
      note: "Flexible cash left this month",
      icon: CircleDollarSign,
    },
    {
      label: "Habits",
      value: "4/6",
      note: "Tracked routines checked in today",
      icon: ListChecks,
    },
    {
      label: "Dates",
      value: "3",
      note: "Things coming up in the next week",
      icon: CalendarDays,
    },
  ];

  const savedThings = [
    "Renew passport before fall travel",
    "Try the roasted tomato pasta recipe",
    "Research better high-yield savings options",
    "Gift idea: ceramic pour-over set",
  ];

  return (
    <div className="pb-16">
      <MarketingContainer>
        <section className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Private workspace
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                {siteConfig.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                {siteConfig.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/trackers">Review trackers</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {dailySignals.map((signal) => {
                const Icon = signal.icon;

                return (
                  <div
                    key={signal.label}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {signal.label}
                      </p>
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-3xl font-semibold">
                      {signal.value}
                    </p>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      {signal.note}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_0.9fr]">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Current focus</h2>
                </div>
                <p className="mt-3 text-3xl font-semibold">
                  Get finances cleaner and keep notes searchable.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  A simple place for money signals, personal tasks, saved ideas,
                  and the random loose ends that should not live in your head.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <NotebookPen className="size-4 text-muted-foreground" />
                  <h3 className="font-medium">Saved for later</h3>
                </div>
                <div className="space-y-3">
                  {savedThings.map((thing) => (
                    <div
                      key={thing}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {thing}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
              <Search className="size-4 shrink-0" />
              Search is ready for notes, subscriptions, deadlines, ideas, and
              anything else this dashboard grows into.
            </div>
          </div>
        </section>
      </MarketingContainer>
    </div>
  );
}
