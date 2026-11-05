import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle } from "lucide-react";

export function MoneyFlowLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Money Flow"
      data-testid="money-flow-loading"
      className="flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col overflow-hidden bg-background"
    >
      <output className="sr-only">Loading Money Flow...</output>
      <div aria-hidden="true" className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-[57px] shrink-0 items-center gap-4 border-b border-border px-3 md:h-[45px]">
          <Skeleton className="h-11 w-28 md:h-8" />
          <span className="ml-auto inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium leading-4 text-muted-foreground">
            <LoaderCircle
              aria-hidden="true"
              className="size-3.5 animate-spin motion-reduce:animate-none"
            />
            Loading
          </span>
        </div>
        <div className="grid shrink-0 gap-2 border-b border-border px-3 py-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 md:px-4">
          <div className="grid gap-2 sm:flex sm:items-center sm:gap-4">
            <Skeleton className="h-11 w-full sm:w-64 md:h-10" />
            <div className="flex h-11 items-center justify-between gap-4 sm:h-8">
              <Skeleton className="size-4" />
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-20" />
              </div>
              <Skeleton className="size-4" />
            </div>
          </div>
          <Skeleton className="h-12 w-full sm:w-40 md:h-10" />
        </div>
        <div className="grid shrink-0 grid-cols-2 border-b border-border xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex min-w-0 items-center gap-3 border-border px-3 py-2.5 even:border-l [&:nth-child(-n+2)]:border-b sm:px-4 sm:py-3 xl:border-r xl:even:border-l-0 xl:[&:nth-child(-n+2)]:border-b-0"
            >
              <Skeleton className="size-4 shrink-0" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-2.5 w-20 max-w-full" />
                <Skeleton className="h-5 w-24 max-w-full" />
              </div>
            </div>
          ))}
        </div>
        <div
          className="relative min-h-0 flex-1 overflow-hidden bg-muted/10"
          style={{
            backgroundImage:
              "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <svg
            className="absolute inset-0 hidden size-full stroke-border sm:block"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M22 32H36Q40 32 40 36V41Q40 45 44 45H50M50 45H59Q63 45 63 49V60Q63 64 67 64H78"
              vectorEffect="non-scaling-stroke"
              strokeWidth="1.5"
            />
          </svg>
          <div className="absolute left-[22%] top-[32%] hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            <NodePlaceholder />
          </div>
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
            <NodePlaceholder primary />
          </div>
          <div className="absolute left-[78%] top-[64%] hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            <NodePlaceholder />
          </div>
          <div className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 gap-2 rounded-md border border-border bg-background p-2 shadow-sm md:top-3 md:bottom-auto md:left-3 md:translate-x-0 md:flex-col">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="size-7 shrink-0" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NodePlaceholder({ primary = false }: Readonly<{ primary?: boolean }>) {
  return (
    <div
      className={`w-40 space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm ${primary ? "w-48 ring-4 ring-border/20" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-7 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}
