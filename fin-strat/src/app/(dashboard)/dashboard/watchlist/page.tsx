import { WatchlistItems } from "@/features/watchlist/components/watchlist-items";
import { WatchlistQuickCapture } from "@/features/watchlist/components/watchlist-quick-capture";

export default function WatchlistPage() {
  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Watchlist
        </h1>
        <p className="mt-2 text-muted-foreground">
          Money notes, saved research, and small things worth checking later.
        </p>
      </div>
      <WatchlistQuickCapture />
      <WatchlistItems />
    </div>
  );
}
