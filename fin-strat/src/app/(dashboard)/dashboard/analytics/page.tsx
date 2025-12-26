export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Analytics</h1>
      <div className="space-y-6">
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p className="text-muted-foreground">
            Analytics data will be displayed here.
          </p>
        </div>
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Charts</h2>
          <p className="text-muted-foreground">
            Chart visualizations will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}

