import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarketingContainerProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingContainer({
  children,
  className,
}: Readonly<MarketingContainerProps>) {
  return (
    <div className={cn("container mx-auto px-4", className)}>{children}</div>
  );
}
