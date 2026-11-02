import { Skeleton } from "@/components/ui/skeleton";

export function BankAccountListLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Bank accounts"
      className="h-[calc(100dvh-4rem)] min-w-0 space-y-8 overflow-hidden bg-background p-4 sm:p-6"
    >
      <output className="sr-only">Loading bank accounts...</output>
      <div aria-hidden="true" className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-11 w-40 md:h-9" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="space-y-6 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-4 w-32 max-w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
