"use client";

import { useId, useState, type FormEvent } from "react";
import { Check, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentMockUser } from "@/features/auth/mock-session";

import { MAX_CAPTURE_LENGTH, saveWatchlistCapture } from "../captures";

export function WatchlistQuickCapture() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const trimmedText = text.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedText) return;

    const user = getCurrentMockUser();
    try {
      saveWatchlistCapture(window.localStorage, user.id, {
        id: crypto.randomUUID(),
        text: trimmedText,
        createdAt: new Date().toISOString(),
      });
    } catch {
      setSaved(false);
      setError(
        "Couldn't save your note. Your text is still here; check browser storage and try again."
      );
      return;
    }
    setError(null);
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

      <form
        onSubmit={handleSubmit}
        data-testid="watchlist-quick-capture"
        className="p-4 sm:p-5"
      >
        <label htmlFor={inputId} className="sr-only">
          New watchlist note
        </label>
        <textarea
          id={inputId}
          aria-describedby={statusId}
          data-testid="watchlist-capture-input"
          value={text}
          maxLength={MAX_CAPTURE_LENGTH}
          onChange={(event) => {
            setText(event.target.value);
            setSaved(false);
          }}
          className="min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-base leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
          placeholder="What do you want to remember?"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div
            id={statusId}
            className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
          >
            {saved ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <output>Saved locally</output>
              </>
            ) : (
              <span>
                {text.length} / {MAX_CAPTURE_LENGTH}
              </span>
            )}
          </div>
          <Button type="submit" disabled={!trimmedText}>
            <Save />
            Save note
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
