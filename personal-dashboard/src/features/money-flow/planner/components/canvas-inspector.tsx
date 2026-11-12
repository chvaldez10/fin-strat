"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function CanvasInspector({
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
  const mobile = useIsMobile();
  if (mobile)
    return (
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open && !pending) onClose();
        }}
      >
        <SheetContent
          side="bottom"
          data-testid="money-flow-inspector"
          className="max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">{children}</div>
        </SheetContent>
      </Sheet>
    );
  return (
    <aside
      aria-label={title}
      data-testid="money-flow-inspector"
      className="absolute inset-y-4 right-4 z-20 w-80 overflow-y-auto overscroll-contain rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xl shadow-black/5"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Close element editor"
          onClick={onClose}
          disabled={pending}
        >
          <X aria-hidden="true" />
        </Button>
      </header>
      <div className="p-5">{children}</div>
    </aside>
  );
}
