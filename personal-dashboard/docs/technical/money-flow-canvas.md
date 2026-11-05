# How the monthly money planner works

Money opens to the selected bank account's monthly canvas. Its main question is
**does salary cover expenses and savings?** A compact summary keeps that context
above the elements. Monthly details, recurring payments, subscriptions and accounts are secondary
pages; the yearly table stays behind a button. All views share financial records.

This guide describes the running architecture. The
[refactor plan](../plans/monthly-money-planner.md) records the product decisions;
the [Convex integration record](../plans/money-flow-convex-integration.md) covers
authentication and deployment configuration.

## Start with the pages

All paths below start with `/dashboard/watchlist/money-flow`.

| Path                    | What the page does                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/`                     | Main monthly canvas with account switching and salary coverage.                                                     |
| `/planner`              | Scheduled monthly amounts, confirmed cash carryover and optional year view.                                         |
| `/recurring`            | Manage household bills such as mortgage, insurance and car payments.                                                |
| `/subscriptions`        | Manage recurring services and memberships, including multiple subscriptions to the same provider.                   |
| `/accounts`             | List bank and credit accounts, keeping cash and money owed separate.                                                |
| `/accounts/[accountId]` | Update a manually recorded balance and review payments. Credit accounts show statement amounts and scheduled dates. |
| `/[accountId]`          | Monthly canvas for a bank account. Existing canvas URLs still work.                                                 |

The month is kept in the URL as `?month=YYYY-MM`; without a selection, the planner
uses the browser's current month. Page navigation preserves the selected month
where supplied. The server checks supported dates independently.

`MoneyNavigation` is shared by the canvas and every detail page. It owns one
destination list and selected-month links: wide layouts show tabs; narrow layouts
show the current page with a navigation dropdown. Account details belongs to the
canvas account toolbar rather than becoming a second navigation bar.

`MonthlyBudgetSummary` presents the same income, expenses, savings and remaining
amounts in both views. The canvas and monthly wrappers supply the same calculation
and use `className` to fit their surroundings. The summary includes all accounts;
the payment-list account filter only filters rows.

Monthly details keeps the payment list visible. Cash carryover, salary/savings
schedules and next month's dates are collapsed disclosures. Less frequent actions
(salary setup, review and the optional year view) live in the actions menu.

Planner filters and editors reuse the existing Radix `Select` primitive from
`src/components/ui/select.tsx`, also used by bank setup. Form selections use
`Select`; navigation and action menus use the existing `DropdownMenu` components.
Neither shared primitive imports Money routes or financial data.

`ScheduleCollectionPage` owns the category filter and editor state;
`ScheduleCollectionList` renders the rows and their next scheduled dates. Their
props are read-only. Independent database operations run in awaited batches;
save queues and browser-import batches use ordered asynchronous continuations
so a lint cleanup cannot make revision-dependent writes concurrent.

```mermaid
flowchart TD
    Month["Monthly details and checklist"]
    Bills["Recurring payments page"]
    Subs["Subscriptions page"]
    Accounts["Bank and credit account pages"]
    Canvas["Primary monthly canvas"]
    Records["Shared records: accounts, schedules and individual payments"]
    Rules["Pure rules: recurrence, salary coverage and carryover"]
    Server["Convex: ownership, revisions and storage"]

    Month --> Records
    Bills --> Records
    Subs --> Records
    Accounts --> Records
    Canvas -->|Projects records into elements| Records
    Records --> Rules
    Records --> Server
```

The monthly details page at `/planner` does not need React Flow to load. The
yearly table is dynamically loaded only when opened. `CanvasHomePage` selects a
bank account and reuses `PlannerCanvasPage`, which also serves the existing
account canvas URLs. The bank choice is remembered in the main canvas URL as
`?account=...`; changing the month keeps the account's canvas session mounted.

Clicking an element opens `CanvasPaymentForm` directly on the canvas: name,
amount and payment date. Several occurrences can be selected by date in that
same inspector. Desktop uses a nonmodal side panel; mobile uses a bottom sheet.
More details reuses the existing payment editor. Completion controls are removed. The
original canvas/workspace components remain in the codebase. `AccountSwitcher`,
`MoneyElement` and `CanvasViewControls` are reused by the main canvas. Restoring
loaded positions affects layout only.

## The three important records

A **schedule** describes what repeats. A **payment** is one occurrence of that
schedule, or a one-off item. A **monthly review** records confirmed carryover and
whether the month's plan has been reviewed.

For example, a mortgage paid every two weeks has one recurring definition but
two or three individual payment records in a month. Editing one occurrence
does not change the entire series.

| Table                  | Responsibility                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `moneyPlannerSettings` | Tracking start month, migration marker and recurring-schedule revision.                                                                                                              |
| `moneyPlannerAccounts` | Bank/credit account metadata, manual balance, last update and account revision.                                                                                                      |
| `moneyPlannerSeries`   | Effective-dated schedule versions. Subscriptions are schedules with `isSubscription`.                                                                                                |
| `moneyPlannerPayments` | Amount, scheduled date, account and revision; legacy completion fields are retained but no longer edited in the UI. Card statements are linked payment records, not a separate copy. |
| `moneyPlannerMonths`   | Confirmed carry-in/out, reviewed status and generation revision.                                                                                                                     |
| `moneyPlannerLayouts`  | Canvas positions, pan/zoom and layout revision. No financial amounts.                                                                                                                |

Every row belongs to the authenticated user. Account references use stable domain
IDs so existing account links survive migration. Server mutations validate that
referenced accounts belong to the user too.

```mermaid
erDiagram
    moneyPlannerAccounts ||--o{ moneyPlannerPayments : "funds or receives"
    moneyPlannerSeries ||--o{ moneyPlannerPayments : "generates occurrences"
    moneyPlannerMonths ||--o{ moneyPlannerPayments : "reviews a month's plan"
    moneyPlannerAccounts ||--o| moneyPlannerLayouts : "has canvas positions"

    moneyPlannerSeries {
        string seriesId
        string effectiveFrom
        string effectiveTo
        string frequency
        number amountCents
    }
    moneyPlannerPayments {
        string occurrenceKey
        string originalDate
        string dueDate
        string month
        string accountId
        number revision
    }
```

These are logical relationships. A payment can be unassigned to an account or be
a one-off with no schedule. Several fields, including amounts and dates shown in
the diagram, can be null.

## Follow a month opening

[`usePlanner`](../../src/features/money-flow/planner/use-planner.ts) subscribes to
`moneyPlanner.getMonth`. If the month needs initialization or regenerated
schedules, it calls `moneyPlanner.openMonth`.

On the first opening, one transaction creates settings and imports the existing
plan. Later openings generate only missing payments or eligible pending updates
for that month. An occurrence key identifies the original schedule/date, so
opening the same month twice cannot create two copies. A rescheduled occurrence
keeps its original key even if its due date moves into another month.

The server's existing `getMonth` query also returns historical pending and
settled rows for compatibility. The `usePlanner` adapter exposes only non-skipped
entries assigned to the selected month. Without completion tracking, an old
pending record is not evidence of an unpaid debt. Moving a payment's scheduled
date into another month moves the same record; it does not clone the bill.

## How the salary check works

The first version is a salary-allocation and cash-planning view:

```text
commitments = direct bills + card repayments + savings scheduled this month
remaining salary = salary - commitments
remaining funds = remaining salary + confirmed carry-in cash
```

Scheduled commitments count toward the allocation regardless of legacy completion status. Carry-in cash is displayed
separately and never suppresses an over-salary warning. Internal bank transfers
are excluded from the all-account commitment total. Savings are counted once as
an allocation, rather than twice as an allocation and a transfer.

The screen uses the pure calculation function in
[`totals.ts`](../../src/features/money-flow/planner/totals.ts):

```ts
const totals = plannerTotals(
  data.entries,
  data.accounts,
  month,
  data.carryInCents,
  data.settlements
);

// totals.remaining: salary after expenses and savings
// totals.available: includes confirmed carry-in; null when it is unconfirmed
// totals.unknown: amounts still unknown, rather than zero
```

Amounts are integer cents in CAD. A payment amount of `0` means an intentional
zero; a payment amount of `null` means unknown. Unknown and estimated amounts
make totals provisional. In imported **month overrides**, `null` has a different
legacy meaning: skip that month's scheduled payment.

The UI does not track **paid**, **received** or **completed** states. The former
`PaymentStatusEditor`, status-label helper, backend mutation and stored history
are retained for compatibility, but routed pages do not render completion controls.
Balances remain manual snapshots. Carry-out is manually confirmed; the review
no longer offers a calculation based on completion dates.

## Separate categories, one schedule table

Recurring household payments and subscriptions have separate management pages.
Both use `ScheduleCollectionPage` and `ScheduleEditor`, backed by the existing
`moneyPlannerSeries` table. A category change edits the same schedule rather
than creating another record. Salary, savings and transfer schedules stay in
Monthly details.

```ts
// The same schedule rows power both pages.
const recurringPayments = schedules.filter(
  (item) => item.kind === "expense" && !item.isSubscription
);
const subscriptions = schedules.filter(
  (item) => item.kind === "expense" && item.isSubscription
);
```

```mermaid
flowchart LR
    Bills["/recurring: mortgage, insurance"] --> Series["moneyPlannerSeries"]
    Subs["/subscriptions: YouTube Premium"] --> Series
    Series --> Instances["moneyPlannerPayments: dated occurrences"]
    Instances --> Canvas["Monthly canvas and salary totals"]
```

The boolean `isSubscription` is the category discriminator; there is no separate
subscription schedule table or migration. Active/paused/cancelled refers to the
schedule's future activity, not whether an occurrence was paid.

## Credit cards and subscriptions share payment records

A subscription paid from a bank account is a direct cash commitment. A
subscription charged to a credit card is shown as a service cost, but is excluded
from that direct-cash total. The card repayment is the cash commitment instead.
Adding both would count the same charge twice.

A card statement is a payment with `kind: "cardPayment"`, a statement month,
statement balance, due date, planned repayment amount, source bank account and
destination credit account. There is one payment record per card/statement
month. The statement month and due/payment months can differ.

```mermaid
flowchart LR
    Statement["Credit account: November statement"]
    Payment["Shared card-payment record: scheduled in December"]
    Planner["December monthly checklist"]
    Element["Expense element on the paying bank's December canvas"]

    Statement --> Payment
    Payment --> Planner
    Payment --> Element
```

Editing the amount or scheduled date from either page updates that record.
[`canvas-projection.ts`](../../src/features/money-flow/planner/canvas-projection.ts)
groups the bank's monthly payments into display elements. Credit repayments use
an expense element. Several occurrences of one recurring schedule share one
element, whose inspector lists the individual payments.

The source record keeps the credit meaning; the canvas type controls appearance:

```ts
const kind = income
  ? "income"
  : first.kind === "savings" || first.kind === "transfer"
    ? "account"
    : "expense"; // Includes cardPayment.
```

Yearly subscription costs appear in full on the billing date. Their monthly
equivalent is informational and is not added as another monthly payment.

## Recurrence and history

[`recurrence.ts`](../../src/features/money-flow/planner/recurrence.ts) uses calendar
dates with UTC fields, avoiding daylight-saving shifts. It supports one-off,
weekly, every-two-weeks, twice-monthly, monthly and yearly schedules.

Every-two-weeks advances by 14 days from an anchor date; it can create three
payments in one month. Twice-monthly uses two calendar-day slots. Short months
clamp dates to the last valid day; two slots remain two payments even if both
clamp to the same date. End dates are optional and inclusive.

Editing one payment updates only that record and marks it as a manual exception.
Editing a recurring schedule creates an effective-dated version. Generation
preserves paid items, manual exceptions and reviewed months. Timing changes with
unresolved custom upcoming payments require those exceptions to be resolved
first, preventing accidental duplicate obligations.

## Follow an edit from screen to server

```mermaid
sequenceDiagram
    actor User
    participant Form as Payment editor or inline amount
    participant API as plannerPayments.save
    participant DB as Convex database
    participant Views as Planner, account page and canvas

    User->>Form: Save an amount or scheduled date
    Form->>API: Payment ID, expected revision and changes
    API->>DB: Check owner, references and current revision
    alt Request came from a canvas
        API->>DB: Check active canvas session too
    end
    alt Revision is current and data is valid
        API->>DB: Update the payment and increment revision
        DB-->>Views: Live query updates
        API-->>Form: Confirm saved
    else Conflict or failure
        API-->>Form: Error; retain entered values
    end
```

Forms prevent duplicate submissions and retain values after failures. Inline
amount edits remember the revision at the start of editing. An old window cannot
silently overwrite a newer payment revision. The phone layout shows payment
cards; wider layouts show a table with inline amounts.

Canvas financial edits use the same payment mutations. Layout writes use a
separate serial `SaveQueue`, so moving a card cannot overwrite a financial record.
The existing 90-second canvas lease renews every 20 seconds. A normally opened
second canvas is blocked; refresh or the explicit takeover button requests
control. The button requests takeover directly, with a pending state. Server
guards reject writes from displaced canvas sessions. Ordinary planner/account
pages use record revisions and do not acquire the canvas layout lock.

## Migration and the original canvas

The initial import copies existing accounts and schedules with stable source
identities and preserves monthly totals, exact dates, zero/skipped overrides and
linked transfers. Incoming counterparts are not mistaken for additional salary.
Original workspace documents remain intact as recovery sources. Imported bank
balances are labelled unverified opening balances; forecast entries are not
proof that payments were made.

The current canvas projects shared monthly payments. Stored original positions
are reused where the imported schedules correspond to old elements. Notes and
other original graph details remain in the preserved original workspace records.
Changing payment dates/amounts no longer writes an independent copy of finances
inside that old graph.

After migration, legacy full-workspace saves, scenario changes and replacement
imports are rejected. Bank creation from the new accounts API also creates the
legacy bank identity needed by existing canvas URLs and session guards, in the
same transaction. No finance records are seeded from screenshots or demo data.

## Where to change things

Feature paths below are relative to `src/features/money-flow/planner/`.

| Change                                   | Start here                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Monthly composition and filters          | `components/monthly-planner-page.tsx`                                                                               |
| Shared page navigation                   | `components/money-navigation.tsx`, `planner-shell.tsx`, `planner-canvas-page.tsx`                                   |
| Shared budget summary                    | `components/monthly-budget-summary.tsx`, `monthly-salary-summary.tsx`, `canvas-budget-summary.tsx`, `totals.ts`     |
| Month loading/navigation                 | `use-planner.ts`, `use-planner-month.ts`, `convex/moneyPlanner.ts`                                                  |
| Payment fields and scheduled amounts     | `components/payment-editor.tsx`, `payment-fields.tsx`, `payment-list.tsx`                                           |
| Recurring schedules                      | `recurrence.ts`, `components/schedule-editor.tsx`, `convex/plannerSchedules.ts`                                     |
| Recurring payment and subscription pages | `components/schedule-collection-page.tsx`, `subscriptions-page.tsx`                                                 |
| Accounts and statements                  | `components/accounts-page.tsx`, `account-details-page.tsx`, `account-editor.tsx`, `convex/plannerAccounts.ts`       |
| Carryover/review                         | `components/month-review-editor.tsx`, `convex/moneyPlanner.ts`                                                      |
| Canvas elements and layout               | `canvas-projection.ts`, `components/planner-canvas.tsx`, `planner-element-inspector.tsx`, `convex/plannerCanvas.ts` |
| Optional year view                       | `components/year-view.tsx`, `convex/plannerYear.ts`                                                                 |
| Schema, validation and migration         | `convex/plannerSchema.ts`, `convex/lib/planner.ts`, `convex/lib/plannerMigration.ts`                                |

Shared buttons, sheets and date pickers remain in `src/components/ui/`. The
previous `components/workspace/` editor remains available in source for reference
but is no longer the routed monthly UI. Generated Convex API files are generated
by tooling, not hand-edited.

The backend is the configured Personal Dashboard Convex deployment, shared by
localhost and hosting. The personal-site database is separate. There is no bank
synchronization or individual credit-card purchase ledger in this version.
