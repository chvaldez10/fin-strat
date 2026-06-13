import { Button } from "@/components/ui/button";
import { EmptyState, FormSection, SearchInput } from "@/components/patterns";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Section } from "@/components/layout/public/section";

export default function TrackersPage() {
  const trackers = [
    {
      title: "Habits",
      description: "Movement, sleep, reading, and anything else worth repeating.",
      value: "4 active",
    },
    {
      title: "Money",
      description: "Bills, subscriptions, savings notes, and monthly buffer.",
      value: "$420 buffer",
    },
    {
      title: "Ideas",
      description: "Restaurants, recipes, gifts, projects, and links to revisit.",
      value: "18 saved",
    },
  ];

  return (
    <MarketingContainer>
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight">Trackers</h1>
          <p className="mt-4 text-muted-foreground">
            A few lightweight buckets for whatever you want to keep track of.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {trackers.map((tracker) => (
            <FormSection
              key={tracker.title}
              title={tracker.title}
              description={tracker.description}
            >
              <p className="text-3xl font-semibold">{tracker.value}</p>
            </FormSection>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-5xl">
          <FormSection title="Find something">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <SearchInput placeholder="Search trackers" />
              <Button>Search</Button>
            </div>
          </FormSection>
        </div>
        <div className="mx-auto mt-8 max-w-5xl">
          <EmptyState
            title="No custom tracker yet"
            description="This is ready for whatever odd little personal signal deserves its own space."
            action={<Button variant="secondary">Add tracker</Button>}
          />
        </div>
      </Section>
    </MarketingContainer>
  );
}
