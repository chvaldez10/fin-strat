import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, FormSection, SearchInput } from "@/components/patterns";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Section } from "@/components/layout/public/section";

export default function ComponentsPage() {
  return (
    <MarketingContainer>
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Component Examples
          </h1>
          <p className="mt-4 text-muted-foreground">
            Reusable primitives and app patterns composed into production-ready
            interface examples.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
          <FormSection
            title="Buttons"
            description="Actions use consistent variants, sizing, and focus states."
          >
            <div className="flex flex-col gap-3">
              <Button>Primary action</Button>
              <Button variant="outline">Secondary action</Button>
            </div>
          </FormSection>
          <FormSection
            title="Forms"
            description="Inputs inherit the shared token system and accessibility states."
          >
            <div className="space-y-3">
              <Input placeholder="name@example.com" type="email" />
              <Button className="w-full">Submit</Button>
            </div>
          </FormSection>
          <FormSection
            title="Search"
            description="Search inputs wrap shared input behavior with product patterns."
          >
            <SearchInput placeholder="Search components" />
          </FormSection>
        </div>
        <div className="mx-auto mt-8 max-w-5xl">
          <EmptyState
            title="No custom component selected"
            description="Use empty states to make sparse screens feel intentional."
            action={<Button variant="secondary">Create component</Button>}
          />
        </div>
      </Section>
    </MarketingContainer>
  );
}
