"use client";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "The requested view could not be loaded. Try again or return later.",
  actionLabel = "Try again",
  onAction,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </div>
  );
}
