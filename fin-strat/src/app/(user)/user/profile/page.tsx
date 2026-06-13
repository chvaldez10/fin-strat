import type { Metadata } from "next";
import {
  BadgeCheck,
  Bell,
  ListChecks,
  MapPin,
  NotebookPen,
  UserRound,
} from "lucide-react";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Section } from "@/components/layout/public/section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "User Profile",
};

const profileStats = [
  {
    label: "Saved notes",
    value: "18",
    icon: NotebookPen,
  },
  {
    label: "Active trackers",
    value: "4",
    icon: ListChecks,
  },
  {
    label: "Notifications",
    value: "7",
    icon: Bell,
  },
];

const activityItems = [
  "Added a receipt note for the bike tune-up",
  "Checked off reading and movement habits",
  "Saved travel insurance research for later",
];

export default function UserProfilePage() {
  return (
    <MarketingContainer>
      <Section className="space-y-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <Avatar className="size-24">
              <AvatarFallback className="text-2xl font-bold">CH</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Chris
                </h1>
                <BadgeCheck className="size-5 text-primary" />
              </div>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Personal dashboard owner. Notes, reminders, and trackers live
                here when they need somewhere calmer than memory.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <UserRound className="size-4" />
                  Personal workspace
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4" />
                  Home base
                </span>
              </div>
            </div>
            <div className="flex gap-3 lg:flex-col">
              <Button>Edit profile</Button>
              <Button variant="outline">View settings</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {profileStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Recent activity</h2>
            <div className="mt-6 space-y-4">
              {activityItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-background p-4 text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Weekly review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A quick sense of how much of the week has been checked, sorted,
              or filed away.
            </p>
            <div className="mt-6 h-3 rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
            <p className="mt-3 text-sm font-medium">75% complete</p>
          </section>
        </div>
      </Section>
    </MarketingContainer>
  );
}
