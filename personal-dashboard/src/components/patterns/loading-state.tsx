import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type LoadingStateProps = Omit<ComponentProps<"div">, "children"> & {
  variant?: "page" | "dashboard";
  label?: string;
  className?: string;
};

export function LoadingState({
  variant = "page",
  label = "Loading...",
  className,
  ...props
}: LoadingStateProps) {
  if (variant === "dashboard") {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center px-4",
          className
        )}
        {...props}
      >
        <output className="sr-only">{label}</output>
        <div aria-hidden="true" className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center px-4 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      <output>{label}</output>
    </div>
  );
}
