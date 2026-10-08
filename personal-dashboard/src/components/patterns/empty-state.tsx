import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  children,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-dashed border-border bg-card p-4 text-center sm:p-8",
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
