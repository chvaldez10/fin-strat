"use client";
import { useRef, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { errorMessage } from "../use-planner";
import { parseMoneyCents } from "../../amounts";
import { formatDateOnly, calendarDate } from "@/lib/date-only";
import { useCanvasWriteContext } from "./planner-write-context";
import { withWorkspaceAccess } from "../../persistence/workspace-write-access";

export const selectClass =
  "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}
export function PlannerSheet({
  title,
  description,
  onClose,
  pending = false,
  children,
}: Readonly<{
  title: string;
  description: string;
  onClose: () => void;
  pending?: boolean;
  children: ReactNode;
}>) {
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border pr-12">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
export function usePlannerAction() {
  const canvas = useCanvasWriteContext();
  const running = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return {
    busy,
    error,
    run: async (work: () => Promise<unknown>, done?: () => void) => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      setError("");
      try {
        await (canvas ? withWorkspaceAccess(canvas.access, work) : work());
        done?.();
      } catch (cause) {
        setError(errorMessage(cause));
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
  };
}
export function amountText(cents: number | null) {
  return cents === null ? "" : (cents / 100).toString();
}
export function amountValue(text: string, negative = false) {
  if (!text.trim()) return null;
  const cents = parseMoneyCents(text, { allowNegative: negative });
  if (cents === null)
    throw new Error("Enter a valid amount with up to two decimal places.");
  return cents;
}
export function localToday() {
  const value = new Date();
  return formatDateOnly(
    calendarDate(value.getFullYear(), value.getMonth(), value.getDate())
  );
}
export function FormError({ message }: Readonly<{ message: string }>) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
