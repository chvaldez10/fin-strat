import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
