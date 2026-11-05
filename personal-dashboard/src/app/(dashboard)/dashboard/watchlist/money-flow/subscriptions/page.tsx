import type { Metadata } from "next";
import { SubscriptionsPage } from "@/features/money-flow/planner/components/subscriptions-page";
export const metadata: Metadata = {
  title: "Subscriptions | Personal Dashboard",
};
export default function Page() {
  return <SubscriptionsPage />;
}
