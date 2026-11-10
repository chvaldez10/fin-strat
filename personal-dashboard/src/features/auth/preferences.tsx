"use client";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "./use-user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
type Preferences = {
  reducedMotion: boolean;
  weeklyReview: boolean;
  showMoney: boolean;
};
export function PreferencesPage() {
  const user = useUser();
  const saved = useQuery(api.preferences.get, user ? {} : "skip");
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
  const [draft, setDraft] = useState(saved),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const save = useMutation(api.preferences.save);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      await save(draft);
      setMessage("Preferences saved.");
    } catch {
      setMessage(
        "Could not save preferences. Your changes are still here; retry when connected."
      );
    } finally {
      setPending(false);
    }
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
            checked={draft[key]}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, [key]: checked === true })
            }
          />
        </label>
      ))}
      <p className="text-sm text-muted-foreground">
        Weekly review is an on-screen preference. No notifications or emails are
        sent.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
      <output>{message}</output>
    </form>
  );
}
export function ApplyPreferences() {
  const user = useUser();
  const saved = useQuery(api.preferences.get, user ? {} : "skip");
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
