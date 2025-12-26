export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse space-y-4 w-full max-w-4xl">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    </div>
  );
}

