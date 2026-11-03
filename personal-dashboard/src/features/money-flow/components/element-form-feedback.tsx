"use client";
import { useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type ElementSaveState = "idle" | "saving" | "saved" | "failed";

export function useElementSave() {
  const [state, setState] = useState<ElementSaveState>("idle");
  return {
    state,
    reset: () => setState("idle"),
    submit: async (commit: () => Promise<boolean>) => {
      setState("saving");
      try {
        setState((await commit()) ? "saved" : "failed");
      } catch {
        setState("failed");
      }
    },
  };
}

export function ElementSaveFeedback({
  state,
  label,
  confirmation,
}: {
  state: ElementSaveState;
  label: string;
  confirmation: string;
}) {
  return (
    <div className="space-y-2">
      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={state === "saving"}
      >
        <Save aria-hidden="true" />
        {state === "saving" ? "Saving…" : label}
      </Button>
      {state === "saved" && (
        <output
          className="block text-sm text-muted-foreground"
          aria-live="polite"
        >
          {confirmation}
        </output>
      )}
      {state === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          Not saved. Your edits are still here. Try saving again, or resolve any
          conflict above.
        </p>
      )}
    </div>
  );
}

export function ElementField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
