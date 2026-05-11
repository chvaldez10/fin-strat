import Link from "next/link";
import { ArrowRight, Layers3, Palette, PanelsTopLeft } from "lucide-react";
import { siteConfig } from "@/config/site";
import { MarketingContainer } from "@/components/layout/public/marketing-container";
import { Section } from "@/components/layout/public/section";
import { HeroSection } from "@/components/patterns";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-8 pb-16">
      <MarketingContainer>
        <HeroSection
          eyebrow="React and Next.js UI foundations"
          title={`Build polished interfaces with ${siteConfig.name}`}
          description={siteConfig.description}
          actions={
            <>
              <Button asChild size="lg">
                <Link href="/components">
                  Browse components
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">View dashboard shell</Link>
              </Button>
            </>
          }
        />
      </MarketingContainer>

      <MarketingContainer>
        <HeroSection
          variant="split"
          eyebrow="Split Hero"
          title="Pair product copy with a visual system preview."
          description="Use this layout when the hero needs a stronger product story, a preview card, or a dashboard screenshot beside the primary message."
          actions={
            <>
              <Button asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/components">Explore patterns</Link>
              </Button>
            </>
          }
          visual={<HeroPreviewCard />}
        />
      </MarketingContainer>

      <MarketingContainer>
        <Section>
          <HeroSection
            variant="compact"
            eyebrow="Compact Hero"
            title="A tighter hero for docs, sections, and landing page modules."
            description="Use this treatment when the page already has context and the hero should introduce the next section without dominating the screen."
            actions={
              <>
                <Button asChild>
                  <Link href="/components">View examples</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Preview form</Link>
                </Button>
              </>
            }
          />
        </Section>
      </MarketingContainer>
    </div>
  );
}

function HeroPreviewCard() {
  const items = [
    {
      title: "Tokens",
      description: "Typed design decisions",
      icon: Palette,
    },
    {
      title: "Patterns",
      description: "Reusable product flows",
      icon: Layers3,
    },
    {
      title: "Layouts",
      description: "Public and dashboard shells",
      icon: PanelsTopLeft,
    },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="rounded-2xl border border-border bg-muted/50 p-4">
        <div className="mb-6 h-3 w-24 rounded-full bg-foreground/20" />
        <div className="grid gap-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-border bg-background p-4"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
