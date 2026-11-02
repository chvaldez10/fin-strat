import type { ComponentProps } from "react";
import {
  Check,
  CircleAlert,
  GitCompareArrows,
  LoaderCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatusState = "saved" | "saving" | "failed" | "conflict";

const states = {
  saved: { label: "Saved", description: "All changes are saved", icon: Check },
  saving: {
    label: "Saving",
    description: "Saving your changes",
    icon: LoaderCircle,
  },
  failed: {
    label: "Not saved",
    description: "Changes could not be saved",
    icon: CircleAlert,
  },
  conflict: {
    label: "Conflict",
    description: "Review conflicting changes before saving",
    icon: GitCompareArrows,
  },
} satisfies Record<
  SaveStatusState,
  { label: string; description: string; icon: typeof Check }
>;

type SaveStatusProps = ComponentProps<"output"> & { status: SaveStatusState };

/** Presentational only: the consumer supplies the persistence state and recovery actions. */
export function SaveStatus({
  status,
  className,
  children,
  ...props
}: SaveStatusProps) {
  const { label, description, icon: Icon } = states[status];
  return (
    <output
      data-slot="save-status"
      data-state={status}
      aria-live="polite"
      aria-atomic="true"
      title={description}
      className={cn(
        "inline-flex min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium leading-4 text-muted-foreground",
        status === "failed" &&
          "border-destructive/25 bg-destructive/5 text-destructive",
        status === "conflict" && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0",
          status === "saving" && "animate-spin motion-reduce:animate-none"
        )}
      />
      <span>{children ?? label}</span>
    </output>
  );
}
