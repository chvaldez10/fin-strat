"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** Positioned inside the canvas, with measured bounds and one keyboard contract. */
export function CanvasMenu({
  x,
  y,
  title,
  label,
  onClose,
  children,
  testId,
}: {
  x: number;
  y: number;
  title: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
  testId: string;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const parent = menu?.offsetParent;
    if (!menu || !(parent instanceof HTMLElement)) return;
    const place = () =>
      setPosition({
        x: Math.max(8, Math.min(x, parent.clientWidth - menu.offsetWidth - 8)),
        y: Math.max(
          8,
          Math.min(y, parent.clientHeight - menu.offsetHeight - 8)
        ),
      });
    place();
    const observer = new ResizeObserver(place);
    observer.observe(parent);
    observer.observe(menu);
    return () => observer.disconnect();
  }, [x, y]);
  useEffect(() => {
    const menu = menuRef.current;
    const previous = document.activeElement;
    const items = () =>
      Array.from(
        menu?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
      );
    (items()[0] ?? menu)?.focus();
    const pointer = (event: PointerEvent) => {
      if (!menu?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", pointer);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      if (
        previous instanceof HTMLElement &&
        previous.isConnected &&
        (document.activeElement === document.body ||
          menu?.contains(document.activeElement))
      )
        previous.focus();
    };
  }, [onClose, x, y]);
  return (
    <div
      ref={menuRef}
      data-testid={testId}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      className="absolute z-40 max-h-[calc(100%-1rem)] w-60 max-w-[calc(100%-1rem)] overflow-y-auto rounded-2xl border border-border/70 bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/10 outline-none"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        } else if (event.defaultPrevented) return;
        else if (event.key === "Tab") onClose();
        else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)"
            )
          );
          if (!buttons.length) return;
          const current = buttons.indexOf(
            document.activeElement as HTMLButtonElement
          );
          const index =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (current +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          buttons[index]?.focus();
        }
      }}
    >
      <p className="truncate px-3 py-2 text-xs font-medium text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

export function CanvasMenuAction({
  className,
  destructive,
  ...props
}: ComponentProps<"button"> & { destructive?: boolean }) {
  return (
    <button
      {...props}
      type="button"
      role="menuitem"
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
        destructive &&
          "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10",
        className
      )}
    />
  );
}
