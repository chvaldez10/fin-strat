import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Fin Strat
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

