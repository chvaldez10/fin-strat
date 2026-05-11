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
          title="Form Example"
          description="A neutral authentication layout built from shared primitives."
          className="w-full max-w-md"
        >
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </FormSection>
      </Section>
    </MarketingContainer>
  );
}
