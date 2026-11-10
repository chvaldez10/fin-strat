"use client";

import { memo, useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import type { SaveQueue } from "../../persistence/save-queue";
import type { PlannerLayoutValues } from "../use-planner-layout";

/** Saving a camera position does not re-render or disable the month control. */
export const CanvasMonthPicker = memo(function CanvasMonthPicker({
  queue,
  month,
  onMonthChange,
}: Readonly<{
  queue: SaveQueue<PlannerLayoutValues>;
  month: string;
  onMonthChange: (month: string) => void;
}>) {
  const getBlocked = useCallback(() => {
    const { status } = queue.getSnapshot();
    return status === "failed" || status === "conflict";
  }, [queue]);
  const blocked = useSyncExternalStore(queue.subscribe, getBlocked, getBlocked);
  return (
    <MonthPicker
      aria-label="Canvas month"
      className="min-w-0 flex-1 sm:w-auto sm:min-w-44 sm:flex-none"
      value={month}
      disabled={blocked}
      onValueChange={onMonthChange}
    />
  );
});

/** Save updates stay in this small status view, away from the date and graph. */
export function CanvasLayoutStatus({
  queue,
  onRetry,
}: Readonly<{
  queue: SaveQueue<PlannerLayoutValues>;
  onRetry: () => Promise<boolean>;
}>) {
  const { status } = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );
  if (status === "failed")
    return (
      <div className="flex items-center gap-2">
        <p role="alert" className="text-xs text-destructive">
          Layout could not be saved.
        </p>
        <Button size="sm" onClick={() => void onRetry()}>
          Retry layout save
        </Button>
      </div>
    );
  if (status === "conflict")
    return (
      <p role="alert" className="text-xs text-destructive">
        Layout changed elsewhere. Refresh to load its saved positions.
      </p>
    );
  return (
    <span className="hidden text-xs text-muted-foreground sm:inline">
      Auto-save on
    </span>
  );
}
