import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

export default function DashboardPage() {
  const stats = [
    {
      label: "Components",
      value: "12",
      description: "Reusable primitives ready for composition.",
    },
    {
      label: "Layouts",
      value: "2",
      description: "Public and dashboard shells for app-scale examples.",
    },
    {
      label: "Themes",
      value: "2",
      description: "Light and dark modes backed by shared tokens.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard Shell</h1>
        <p className="mt-2 text-muted-foreground">
          A scalable application layout composed from reusable navigation,
          sidebar, header, and surface primitives.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6"
          >
            <h2 className="mb-2 text-xl font-semibold">{stat.label}</h2>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

