import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  visual?: ReactNode;
  variant?: "centered" | "split" | "compact";
  className?: string;
};

export function HeroSection({
  eyebrow,
  title,
  description,
  actions,
  visual,
  variant = "centered",
  className,
}: HeroSectionProps) {
  if (variant === "split") {
    return (
      <section
        className={cn(
          "grid min-h-[calc(100vh-9rem)] items-center gap-10 py-16 lg:grid-cols-[1fr_0.9fr]",
          className
        )}
      >
        <HeroContent
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          align="left"
        />
        {visual ? <div className="min-w-0">{visual}</div> : null}
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <section
        className={cn(
          "rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm md:px-12",
          className
        )}
      >
        <HeroContent
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          align="center"
          compact
        />
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <HeroContent
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
        align="center"
      />
    </section>
  );
}

function HeroContent({
  eyebrow,
  title,
  description,
  actions,
  align,
  compact = false,
}: Pick<HeroSectionProps, "eyebrow" | "title" | "description" | "actions"> & {
  align: "left" | "center";
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-6",
        align === "center" && "mx-auto max-w-3xl text-center",
        align === "left" && "max-w-2xl",
        compact && "space-y-5"
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-bold tracking-tight",
          compact ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl"
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "text-lg text-muted-foreground",
          align === "center" && "mx-auto max-w-2xl"
        )}
      >
        {description}
      </p>
      {actions ? (
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row",
            align === "center" && "justify-center"
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
