import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading monthly planner"
    >
      <Skeleton className="h-11 w-80 max-w-full" />
      <Skeleton className="h-16 w-72 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
