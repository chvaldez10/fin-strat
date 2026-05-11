import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Component Examples
        </h1>
        <p className="mt-4 text-muted-foreground">
          A small showcase of reusable primitives composed into production-ready
          interface patterns.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-2xl font-semibold">Buttons</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Actions use consistent variants, sizing, and focus states.
          </p>
          <div className="flex flex-col gap-3">
            <Button>Primary action</Button>
            <Button variant="outline">Secondary action</Button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-2xl font-semibold">Forms</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Inputs inherit the shared token system and accessibility states.
          </p>
          <div className="space-y-3">
            <Input placeholder="name@example.com" type="email" />
            <Button className="w-full">Submit</Button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-2xl font-semibold">Surfaces</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Cards and layouts compose cleanly across public and dashboard pages.
          </p>
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Token-driven content surface
          </div>
        </div>
      </div>
    </div>
  );
}

