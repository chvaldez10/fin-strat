import type { Metadata } from "next";
import { ScheduleCollectionPage } from "@/features/money-flow/planner/components/schedule-collection-page";

export const metadata: Metadata = {
  title: "Recurring payments | Personal Dashboard",
};

export default function Page() {
  return <ScheduleCollectionPage category="recurring" />;
}
