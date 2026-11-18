"use client";
import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@/features/auth/use-user";
import { Button } from "@/components/ui/button";
import { usePendingAction } from "@/hooks/use-pending-action";
import { CAPTURE_IMPORT_BATCH_SIZE, readCaptureBackups } from "../captures";

export function SavedCaptures() {
  const user = useUser();
  const { results, status, loadMore } = usePaginatedQuery(
    api.watchlist.list,
    user ? {} : "skip",
    { initialNumItems: 20 }
  );
  const remove = useMutation(api.watchlist.remove),
    importNotes = useMutation(api.watchlist.importLocal);
  const [message, setMessage] = useState("");
  const { pending, run } = usePendingAction();
  async function importBackup() {
    if (!user) return;
    setMessage("");
    try {
      const found = readCaptureBackups(localStorage, user.id);
      if (!found.length) {
        setMessage("No local watchlist notes found.");
        return;
      }
      if (
        !window.confirm(
          `Import ${found.length} browser notes into your account? Confirm these notes belong to you. Originals stay in this browser.`
        )
      )
        return;
      // Import bounded batches in order so failures stop subsequent requests.
      let already = true;
      for (
        let offset = 0;
        offset < found.length;
        offset += CAPTURE_IMPORT_BATCH_SIZE
      ) {
        // oxlint-disable-next-line no-await-in-loop -- Stop after the first failed batch.
        const result = await importNotes({
          notes: found.slice(offset, offset + CAPTURE_IMPORT_BATCH_SIZE),
        });
        already = already && result.alreadyImported;
      }
      setMessage(
        already
          ? "These notes were already imported."
          : "Notes imported. Original browser backups were preserved."
      );
    } catch {
      setMessage(
        "Import could not finish. Original notes are intact. Invalid backups need recovery; successful batches can safely be retried."
      );
    }
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Saved notes</h2>
        <Button
          variant="outline"
          disabled={!user || pending}
          onClick={() => {
            void run(importBackup);
          }}
        >
          Import my browser notes
        </Button>
      </div>
      <output>{message}</output>
      {status === "LoadingFirstPage" ? (
        <output>Loading notes…</output>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground">
          No notes yet. Capture your first thought above.
        </p>
      ) : (
        <ul className="space-y-3">
          {results.map((note) => (
            <li
              key={note._id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <p className="min-w-0 whitespace-pre-wrap break-words">
                {note.text}
              </p>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                aria-label={`Delete note: ${note.text.slice(0, 40)}`}
                onClick={() => {
                  void run(async () => {
                    if (!window.confirm("Delete this saved note?")) return;
                    setMessage("");
                    try {
                      await remove({ id: note._id });
                    } catch {
                      setMessage("Could not delete this note. Try again.");
                    }
                  });
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
      {status === "CanLoadMore" && (
        <Button variant="outline" onClick={() => loadMore(20)}>
          Load more notes
        </Button>
      )}
    </section>
  );
}
