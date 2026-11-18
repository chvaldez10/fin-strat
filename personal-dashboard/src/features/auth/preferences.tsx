"use client";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePendingAction } from "@/hooks/use-pending-action";
import { usePreferences, type Preferences } from "./use-preferences";

export function PreferencesPage() {
  const saved = usePreferences();
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      {saved ? (
        <PreferencesForm saved={saved} />
      ) : (
        <output>Loading preferences…</output>
      )}
    </div>
  );
}
function PreferencesForm({ saved }: Readonly<{ saved: Preferences }>) {
  const preferenceId = useId();
  const [edits, setEdits] = useState<Partial<Preferences>>({});
  const [message, setMessage] = useState("");
  const { pending, run } = usePendingAction();
  const save = useMutation(api.preferences.save);
  const hasEdits = Object.keys(edits).length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasEdits) return;
    void run(async () => {
      setMessage("");
      try {
        await save({ ...saved, ...edits });
        setEdits({});
        setMessage("Preferences saved.");
      } catch {
        setMessage(
          "Could not save preferences. Your changes are still here; retry when connected."
        );
      }
    });
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-xl border bg-card p-5"
      aria-busy={pending}
    >
      {(
        [
          ["reducedMotion", "Reduce motion"],
          ["weeklyReview", "Show weekly review prompt"],
          ["showMoney", "Show Money Flow on overview"],
        ] as const
      ).map(([key, label]) => (
        <label
          key={key}
          htmlFor={`${preferenceId}-${key}`}
          className="flex min-h-11 items-center justify-between gap-4"
        >
          {label}
          <Checkbox
            id={`${preferenceId}-${key}`}
            checked={edits[key] ?? saved[key]}
            disabled={pending}
            onCheckedChange={(checked) => {
              const value = checked === true;
              setMessage("");
              setEdits((current) => {
                const next = { ...current };
                if (value === saved[key]) delete next[key];
                else next[key] = value;
                return next;
              });
            }}
          />
        </label>
      ))}
      <p className="text-sm text-muted-foreground">
        Weekly review is an on-screen preference. No notifications or emails are
        sent.
      </p>
      <Button type="submit" disabled={pending || !hasEdits}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
      <output>{message}</output>
    </form>
  );
}
export function ApplyPreferences() {
  const saved = usePreferences();
  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-motion",
      !!saved?.reducedMotion
    );
    return () => {
      document.documentElement.removeAttribute("data-reduce-motion");
    };
  }, [saved?.reducedMotion]);
  return null;
}
