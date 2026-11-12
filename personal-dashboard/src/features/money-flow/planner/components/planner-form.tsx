"use client";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { errorMessage } from "../use-planner";
import { useCanvasWriteContext } from "./planner-write-context";
import { withWorkspaceAccess } from "../../persistence/workspace-write-access";

export const selectClass =
  "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
function PlannerSheetFrame({
  onDismiss,
  children,
}: Readonly<{ onDismiss: () => void; children: ReactNode }>) {
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {children}
      </SheetContent>
    </Sheet>
  );
}

const SheetHostContext = createContext<
  ((dismiss: () => void) => () => void) | null
>(null);

/** Keeps the portal and backdrop open while its active PlannerSheet changes. */
export function PlannerSheetHost({
  children,
}: Readonly<{ children: ReactNode }>) {
  const dismiss = useRef<(() => void) | null>(null);
  const registerDismiss = useCallback((handler: () => void) => {
    dismiss.current = handler;
    return () => {
      if (dismiss.current === handler) dismiss.current = null;
    };
  }, []);
  return (
    <PlannerSheetFrame onDismiss={() => dismiss.current?.()}>
      <SheetHostContext value={registerDismiss}>{children}</SheetHostContext>
    </PlannerSheetFrame>
  );
}

export function PlannerSheet({
  title,
  description,
  onClose,
  pending = false,
  active = true,
  children,
}: Readonly<{
  title: string;
  description: string;
  onClose: () => void;
  pending?: boolean;
  active?: boolean;
  children: ReactNode;
}>) {
  const registerDismiss = useContext(SheetHostContext);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (!registerDismiss || !active) return;
    return registerDismiss(() => {
      if (!pending) onClose();
    });
  }, [registerDismiss, active, onClose, pending]);
  useLayoutEffect(() => {
    if (registerDismiss && active)
      titleRef.current?.focus({ preventScroll: true });
  }, [registerDismiss, active]);
  const contents = (
    <>
      {active && (
        <SheetHeader className="border-b border-border pr-12">
          <SheetTitle
            ref={titleRef}
            tabIndex={registerDismiss ? -1 : undefined}
          >
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
      )}
      <div hidden={!active} className="min-h-0 flex-1 overflow-y-auto p-5">
        {children}
      </div>
    </>
  );
  return registerDismiss ? (
    contents
  ) : (
    <PlannerSheetFrame
      onDismiss={() => {
        if (!pending) onClose();
      }}
    >
      {contents}
    </PlannerSheetFrame>
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
export function FormError({ message }: Readonly<{ message: string }>) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
