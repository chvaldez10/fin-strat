import Link from "next/link";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Section } from "@/components/layout/public/section";
export default function TrackersPage() {
  return (
    <MarketingContainer>
      <Section>
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold">Keep a little more in view</h1>
          <p className="text-muted-foreground">
            Your private dashboard currently supports saved notes and monthly
            cash-flow planning. Additional trackers are planned.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/watchlist"
              className="rounded-xl border bg-card p-6"
            >
              <h2 className="text-xl font-semibold">Watchlist</h2>
              <p className="mt-2 text-muted-foreground">
                Capture notes, links, and research.
              </p>
            </Link>
            <Link
              href="/dashboard/watchlist/money-flow"
              className="rounded-xl border bg-card p-6"
            >
              <h2 className="text-xl font-semibold">Money Flow</h2>
              <p className="mt-2 text-muted-foreground">
                Plan your accounts, transfers, and monthly balances.
              </p>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in with an invited account to access your data.
          </p>
        </div>
      </Section>
    </MarketingContainer>
  );
}
