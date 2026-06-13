"use client";

import { useState } from "react";
import { FormSection } from "@/components/patterns";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState(true);
  const [showMoney, setShowMoney] = useState(true);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Keep the dashboard tuned to what you actually want to see.
        </p>
      </div>
      <div className="max-w-2xl space-y-6">
        <FormSection title="Dashboard preferences">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="reduced-motion" className="text-foreground">
                Reduce motion
              </label>
              <input
                id="reduced-motion"
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => setReducedMotion(event.target.checked)}
                className="size-4 rounded border-border"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="weekly-review" className="text-foreground">
                Weekly review reminders
              </label>
              <input
                id="weekly-review"
                type="checkbox"
                checked={weeklyReview}
                onChange={(event) => setWeeklyReview(event.target.checked)}
                className="size-4 rounded border-border"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="show-money" className="text-foreground">
                Show money summary
              </label>
              <input
                id="show-money"
                type="checkbox"
                checked={showMoney}
                onChange={(event) => setShowMoney(event.target.checked)}
                className="size-4 rounded border-border"
              />
            </div>
            <Button>Save preferences</Button>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
