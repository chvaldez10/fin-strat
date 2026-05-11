"use client";

import { useState } from "react";
import { FormSection } from "@/components/patterns";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          A simple preferences surface for dashboard-style UI composition.
        </p>
      </div>
      <div className="max-w-2xl space-y-6">
        <FormSection title="Preferences">
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
            <Button>Save preferences</Button>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
