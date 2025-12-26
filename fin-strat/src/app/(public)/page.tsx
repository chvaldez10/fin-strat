import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Fin Strat</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-2xl">
        Your comprehensive financial strategy platform
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Login
        </Link>
        <Link
          href="/pricing"
          className="px-4 py-2 border border-border rounded-md hover:bg-accent"
        >
          View Pricing
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-border rounded-md hover:bg-accent"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
