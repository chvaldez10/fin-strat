import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/patterns";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Section } from "@/components/layout/public/section";

export default function LoginPage() {
  return (
    <MarketingContainer>
      <Section className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
        <FormSection
          title="Quick Capture"
          description="Save a thought, task, link, or money note before sorting it."
          className="w-full max-w-md"
        >
          <form className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <Input
                id="title"
                placeholder="Thing to remember"
                type="text"
                required
              />
            </div>
            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium mb-2"
              >
                Note
              </label>
              <Input id="note" placeholder="Add a little context" required />
            </div>
            <Button type="submit" className="w-full">
              Save capture
            </Button>
          </form>
        </FormSection>
      </Section>
    </MarketingContainer>
  );
}
