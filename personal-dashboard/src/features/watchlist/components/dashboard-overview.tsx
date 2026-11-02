"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@/features/auth/use-user";
export function DashboardOverview() {
  const user = useUser();
  const summary = useQuery(api.watchlist.summary, user ? {} : "skip");
  const preferences = useQuery(api.preferences.get, user ? {} : "skip");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          A quiet place for your notes and monthly plan.
        </p>
      </div>
      {!summary ? (
        <output>Loading your dashboard…</output>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/watchlist"
              className="rounded-xl border bg-card p-6"
            >
              <h2 className="text-lg font-semibold">Saved notes</h2>
              <p className="mt-2 text-3xl font-bold">
                {summary.noteCount}
                {summary.moreNotes ? "+" : ""}
              </p>
            </Link>
            {preferences?.showMoney && (
              <Link
                href="/dashboard/watchlist/money-flow"
                className="rounded-xl border bg-card p-6"
              >
                <h2 className="text-lg font-semibold">Money Flow accounts</h2>
                <p className="mt-2 text-3xl font-bold">
                  {summary.accountCount}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {summary.accountCount
                    ? "Open your monthly plan"
                    : "Create your first account workspace"}
                </p>
              </Link>
            )}
          </div>
          {preferences?.weeklyReview && (
            <section className="rounded-xl border p-5">
              <h2 className="font-semibold">Weekly review</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Take a moment to review your saved notes and monthly plan.
              </p>
            </section>
          )}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Recent notes</h2>
            {summary.recentNotes.length ? (
              summary.recentNotes.map((note) => (
                <p
                  key={note.id}
                  className="whitespace-pre-wrap break-words rounded-lg border p-4"
                >
                  {note.text}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">
                Nothing saved yet. Start with a quick capture in your watchlist.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
