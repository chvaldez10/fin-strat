"use client";

import { useState, type FormEvent } from "react";
import { Check, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentMockUser } from "@/features/auth/mock-session";

const MAX_LENGTH = 500;

type WatchlistCapture = {
  id: string;
  text: string;
  createdAt: string;
};

export function WatchlistQuickCapture() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const trimmedText = text.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedText) return;

    const user = getCurrentMockUser();
    const storageKey = `personal-dashboard:watchlist-captures:${user.id}`;
    const existingCaptures = readCaptures(storageKey);
    const capture: WatchlistCapture = {
      id: crypto.randomUUID(),
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      storageKey,
      JSON.stringify([capture, ...existingCaptures])
    );
    setText("");
    setSaved(true);
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
          <NotebookPen className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">Quick capture</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Save a note now and organize it later.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5">
        <label htmlFor="watchlist-capture" className="sr-only">
          New watchlist note
        </label>
        <textarea
          id="watchlist-capture"
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(event) => {
            setText(event.target.value);
            setSaved(false);
          }}
          className="min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="What do you want to remember?"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {saved ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span role="status">Saved locally</span>
              </>
            ) : (
              <span>{text.length} / {MAX_LENGTH}</span>
            )}
          </div>
          <Button type="submit" disabled={!trimmedText}>
            <Save />
            Save note
          </Button>
        </div>
      </form>
    </section>
  );
}

function readCaptures(storageKey: string): WatchlistCapture[] {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "[]"
    );
    return Array.isArray(value) ? (value as WatchlistCapture[]) : [];
  } catch {
    return [];
  }
}
