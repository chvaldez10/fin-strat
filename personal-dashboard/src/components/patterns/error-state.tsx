"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = Omit<ComponentProps<"div">, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "The requested view could not be loaded. Try again or return later.",
  actionLabel = "Try again",
  onAction,
  className,
  children,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-4",
        className
      )}
      {...props}
    >
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {children}
        {onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </div>
  );
}
