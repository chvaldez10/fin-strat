import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-lg border border-border bg-card p-4 sm:p-6",
        className
      )}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
