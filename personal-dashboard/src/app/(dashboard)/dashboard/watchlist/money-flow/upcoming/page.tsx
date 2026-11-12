import type { Metadata } from "next";
import { CanvasHomePage } from "@/features/money-flow/planner/components/canvas-home-page";

export const metadata: Metadata = {
  title: "Scheduled Canvas | Personal Dashboard",
};

export default function ScheduledCanvasPage() {
  return <CanvasHomePage />;
}
