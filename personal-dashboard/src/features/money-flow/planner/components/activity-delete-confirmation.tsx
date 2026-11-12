import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanvasInspector } from "../../components/canvas-inspector";
import { FormError, PlannerSheet } from "./planner-form";

export function ActivityDeleteButton({
  children,
  onClick,
  disabled,
  label,
}: Readonly<{
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}>) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:text-destructive"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Trash2 aria-hidden="true" />
      {children}
    </Button>
  );
}

export function ActivityDeleteConfirmation({
  title,
  description,
  children,
  presentation = "sheet",
  pending,
  error,
  onClose,
  onDelete,
}: Readonly<{
  title: string;
  description: string;
  children: ReactNode;
  presentation?: "canvas" | "sheet";
  pending?: boolean;
  error?: string;
  onClose: () => void;
  onDelete: () => void;
}>) {
  const Container = presentation === "canvas" ? CanvasInspector : PlannerSheet;
  return (
    <Container
      title={title}
      description={description}
      pending={pending}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{children}</p>
        {error && <FormError message={error} />}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onDelete}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </Container>
  );
}
