import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  variant?: "page" | "dashboard";
  label?: string;
  className?: string;
};

export function LoadingState({
  variant = "page",
  label = "Loading...",
  className,
}: LoadingStateProps) {
  if (variant === "dashboard") {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center px-4",
          className
        )}
      >
        <div className="w-full max-w-4xl space-y-4">
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
    >
      {label}
    </div>
  );
}
