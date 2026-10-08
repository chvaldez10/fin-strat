"use client";

import { useEffect, useRef } from "react";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoneyCanvasNode } from "../canvas-types";

export type NodeContextMenuState = {
  node: MoneyCanvasNode;
  x: number;
  y: number;
};

type NodeContextMenuProps = {
  menu: NodeContextMenuState;
  onClose: () => void;
  onDuplicate: (node: MoneyCanvasNode) => void;
  onDelete: (node: MoneyCanvasNode) => void;
};

export function NodeContextMenu({
  menu,
  onClose,
  onDuplicate,
  onDelete,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isProtected = menu.node.data.kind === "chequing";

  useEffect(() => {
    const menuElement = menuRef.current;
    const previousFocus = document.activeElement;
    const getItems = () =>
      Array.from(
        menuElement?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)"
        ) ?? []
      );
    const items = getItems();
    (items[0] ?? menuElement)?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as globalThis.Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (!menuElement?.contains(event.target as globalThis.Node)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        onClose();
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const items = getItems();
        const current = items.indexOf(
          document.activeElement as HTMLButtonElement
        );
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (current +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  items.length) %
                items.length;
        items[index]?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        (document.activeElement === document.body ||
          menuElement?.contains(document.activeElement))
      )
        previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      data-testid="money-flow-node-menu"
      role="menu"
      aria-label={`Actions for ${menu.node.data.label}`}
      tabIndex={-1}
      className="absolute z-40 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <p className="truncate px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {menu.node.data.label}
      </p>
      <ContextAction
        onClick={() => {
          onDuplicate(menu.node);
          onClose();
        }}
        disabled={isProtected}
      >
        <Copy />
        Duplicate
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
      </ContextAction>
      <ContextAction
        variant="destructive"
        onClick={() => {
          onDelete(menu.node);
          onClose();
        }}
        disabled={isProtected}
      >
        <Trash2 />
        Delete
        <span className="ml-auto text-xs text-muted-foreground">Del</span>
      </ContextAction>
      {isProtected ? (
        <p className="px-2 py-1.5 text-xs leading-4 text-muted-foreground">
          The workspace chequing box cannot be duplicated or deleted.
        </p>
      ) : null}
    </div>
  );
}

function ContextAction({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "destructive";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-40 md:min-h-0 [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "destructive" &&
          "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10",
        className
      )}
      {...props}
    />
  );
}
