import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Components</h1>
        <p className="mt-2 text-muted-foreground">
          Examples of shadcn primitives composed into reusable interface blocks.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-2xl font-semibold">Action Group</h2>
          <p className="mb-6 text-muted-foreground">
            Button variants communicate priority while keeping interaction
            states consistent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Save changes</Button>
            <Button variant="secondary">Preview</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-2xl font-semibold">Input Group</h2>
          <p className="mb-6 text-muted-foreground">
            Form controls share sizing, borders, focus rings, and disabled
            states.
          </p>
          <div className="space-y-3">
            <Input placeholder="Search components" />
            <Button className="w-full">Search</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
