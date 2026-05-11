import { Button } from "@/components/ui/button";
import { FormSection, SearchInput } from "@/components/patterns";

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
        <FormSection
          title="Action Group"
          description="Button variants communicate priority while keeping interaction states consistent."
        >
          <div className="flex flex-wrap gap-3">
            <Button>Save changes</Button>
            <Button variant="secondary">Preview</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </FormSection>
        <FormSection
          title="Input Group"
          description="Form controls share sizing, borders, focus rings, and disabled states."
        >
          <div className="space-y-3">
            <SearchInput placeholder="Search components" />
            <Button className="w-full">Search</Button>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
