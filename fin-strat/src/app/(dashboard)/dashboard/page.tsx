import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Dashboard",
};

export default function DashboardPage() {
  const stats = [
    {
      label: "Open loops",
      value: "7",
      description: "Tasks, reminders, and follow-ups waiting for a next step.",
    },
    {
      label: "Monthly buffer",
      value: "$420",
      description: "Estimated flexible cash after planned bills and savings.",
    },
    {
      label: "Tracked habits",
      value: "4/6",
      description: "Daily routines checked off so far.",
    },
  ];

  const priorities = [
    "Review subscriptions before the next billing cycle",
    "Sort saved recipes into weeknight and weekend lists",
    "Pick a better place for warranties and receipts",
  ];

  const upcoming = [
    { date: "Jun 17", item: "Dentist appointment" },
    { date: "Jun 20", item: "Credit card payment" },
    { date: "Jun 24", item: "Renew library holds" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Personal Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          A quiet place to check the things you are keeping an eye on.
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
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">This week</h2>
          <div className="mt-5 space-y-3">
            {priorities.map((priority, index) => (
              <label
                key={priority}
                className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-border"
                  defaultChecked={index === 0}
                />
                <span className="text-sm leading-6">{priority}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Upcoming</h2>
          <div className="mt-5 space-y-3">
            {upcoming.map((event) => (
              <div
                key={`${event.date}-${event.item}`}
                className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-md border border-border bg-background p-3 text-sm"
              >
                <span className="font-medium text-muted-foreground">
                  {event.date}
                </span>
                <span>{event.item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
