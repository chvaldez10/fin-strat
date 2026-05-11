import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center px-4 py-24 text-center">
      <div className="max-w-3xl space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          React and Next.js UI foundations
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Build polished interfaces with {siteConfig.name}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/pricing">Browse components</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">View dashboard shell</Link>
        </Button>
      </div>
    </div>
  );
}
