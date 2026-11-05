"use client";
import { useEffect, useRef } from "react";
import { LockKeyhole, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import type { WorkspaceLeaseStatus } from "../../persistence/use-workspace-lease";

export function WorkspaceSessionBlocked({
  status,
  onBack,
  onTakeControl,
}: Readonly<{
  status: WorkspaceLeaseStatus;
  onBack: () => void;
  onTakeControl: () => void;
}>) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, [status]);
  const displaced = status === "displaced";
  const pending = status === "taking-control";
  const connectionLost = status === "error" || status === "expired";
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
      <EmptyState
        ref={panel}
        tabIndex={-1}
        aria-live="polite"
        className="w-full max-w-lg border-solid outline-none"
        title={
          pending
            ? "Taking control of this canvas"
            : connectionLost
              ? "Canvas connection interrupted"
              : displaced
                ? "Canvas opened in another window"
                : "This canvas is already open"
        }
        description={
          pending
            ? "Loading the latest saved canvas. The other window will be blocked once control is confirmed."
            : connectionLost
              ? "We couldn’t confirm this window still has control. Editing and saving are paused. Refresh to reconnect and take control."
              : displaced
                ? "Another window refreshed and took control. Editing and saving are blocked in this window."
                : "Only one window can edit this canvas at a time. Your other window is still active."
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={onTakeControl}
              disabled={pending}
              aria-busy={pending}
            >
              <RefreshCw
                aria-hidden="true"
                className={
                  pending
                    ? "animate-spin motion-reduce:animate-none"
                    : undefined
                }
              />
              {pending ? "Taking control…" : "Refresh to take control"}
            </Button>
            <Button variant="outline" onClick={onBack} disabled={pending}>
              Back to bank accounts
            </Button>
          </div>
        }
      >
        <LockKeyhole
          aria-hidden="true"
          className="mx-auto size-8 text-muted-foreground"
        />
        <p className="text-sm text-muted-foreground">
          Refreshing loads the latest saved canvas and blocks the other window.
          Unsaved changes in an inactive window won’t be saved.
        </p>
      </EmptyState>
    </div>
  );
}
