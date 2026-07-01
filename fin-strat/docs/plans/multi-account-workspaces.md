# Multi-Account Money Flow Workspaces

## Status

Implemented in the version 4 local demo. Lint, typecheck, and production build
pass as of July 1, 2026. Manual interaction verification remains appropriate
for canvas gestures and account switching.

## Correction

The current in-progress version 4 implementation incorrectly models
Scotiabank and CIBC as simultaneous nodes on one shared canvas.

That is not the intended product model.

A bank account should be the **workspace context**, not a peer node in the
same graph. Selecting an account should switch the complete canvas and table
to that account's cash flow.

This document supersedes the multi-account portion of the existing money-flow
plan and should guide the next implementation pass.

## Intended Experience

- Add an account selector in the money-flow header.
- Seed two mock workspaces:
  - `Scotiabank Chequing`
  - `CIBC Chequing`
- Selecting an account switches both Canvas and Table views.
- Each account has its own:
  - Opening balance.
  - Monthly carry-forward forecast.
  - Canvas nodes and connections.
  - Node positions.
  - Viewport position and zoom.
  - Cash-flow table.
- Only one account workspace is visible at a time.
- The selected account may retain one central Chequing node because the canvas
  is visualizing flow through that account. Other bank accounts must not appear
  as ordinary account nodes on the same canvas.
- Canvas/Table and selected-month state may remain shared UI preferences, but
  graph data and viewport state belong to each account workspace.

## Schema

Use a version 4 document shaped around account workspaces:

```ts
type MoneyFlowDocument = {
  id: string;
  userId: string;
  version: 4;
  currency: "CAD";
  scenario: {
    name: string;
    startMonth: YearMonth;
    forecastMonthCount: number;
  };
  accounts: MoneyFlowAccountWorkspace[];
  view: {
    selectedAccountId: string;
    selectedMonth: YearMonth;
    mode: "canvas" | "table";
  };
};

type MoneyFlowAccountWorkspace = {
  id: string;
  institution: string;
  name: string;
  accountType: "chequing" | "savings";
  openingBalanceCents: number;
  centerNodeId: string;
  nodes: MoneyFlowNode[];
  transfers: MoneyFlowTransfer[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
};
```

`MoneyFlowNode` and `MoneyFlowTransfer` remain canvas-independent domain
records. React Flow types remain confined to `canvas-types.ts`.

## Account Workspaces

Each seeded account gets a separate graph.

### Scotiabank Chequing

- Opening balance: existing migrated opening balance, or `$1,850` for a fresh
  demo.
- Example inflows: paycheque.
- Example outflows: rent, groceries, savings.

### CIBC Chequing

- Opening balance: `$900` for a fresh demo.
- Example inflows: side income.
- Example outflows: utilities.

Nodes from one workspace must never be passed to React Flow while another
workspace is selected.

## Forecast Calculations

Calculate one account workspace at a time:

```text
month ending balance =
  month opening balance
  + direct incoming flows
  - direct outgoing flows

next month opening balance = prior month ending balance
```

`calculateMoneyFlowForecast(document, accountId)` should locate the account
workspace and use only that workspace's nodes and transfers.

The table must use the same calculation output as the canvas summary.

## Account-To-Account Transfers

Do not represent another bank as a normal reusable canvas account node.

For the working demo, model an inter-account transfer as a linked pair:

- Scotiabank workspace: outgoing node such as `Transfer to CIBC`.
- CIBC workspace: incoming node such as `Transfer from Scotiabank`.
- Both flows share an optional `linkedTransferId` so a future editor can update
  both sides atomically.

Recommended transfer extension:

```ts
type MoneyFlowTransfer = {
  id: string;
  linkedTransferId?: string;
  counterpartyAccountId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  baseMonthlyAmountCents: number;
  startMonth: YearMonth;
  endMonth?: YearMonth;
  monthOverrides?: Partial<Record<YearMonth, number | null>>;
  label?: string;
};
```

Automatic linked-transfer editing is optional for the first demo. The schema
should preserve the relationship for later implementation.

## UI Changes

### Header

- Keep the account selector added to `money-summary.tsx`.
- Selecting an account must replace the active workspace, not merely change
  which totals are summarized.
- Keep month navigation and Canvas/Table controls.
- Summary statistics show only the selected account.

### Canvas

- Initialize React Flow with `selectedAccount.nodes`,
  `selectedAccount.transfers`, and `selectedAccount.viewport`.
- Persist drag, connection, edit, delete, and viewport mutations back into the
  selected account workspace only.
- Switching accounts must snapshot the current workspace before loading the
  next one.
- Preserve the existing interaction behavior:
  - Left-click node selection and dragging.
  - Right-drag panning.
  - No lasso selection.
  - Right-click Duplicate/Delete menu.

### Table

- Render only the selected account's monthly cash-flow table.
- Keep horizontal scrolling contained within the dashboard content area.
- Continue showing opening balance, individual cash-in/cash-out rows, totals,
  and ending balance across the forecast horizon.

## Migration From Current Data

The repository currently contains partial version 4 code that uses top-level
accounts linked to nodes in one shared graph. It has not yet received final
lint/type/build verification after that refactor.

The next implementation should normalize both possible saved shapes:

1. **Version 3 single-account document**
   - Move its nodes, transfers, viewport, and opening balance into a
     Scotiabank workspace.
   - Create a fresh CIBC workspace.

2. **Partial version 4 shared-graph document**
   - Detect top-level `nodes`, `transfers`, and `viewport`.
   - Assign existing historical graph data to Scotiabank.
   - Remove the synthetic CIBC bank node from the Scotiabank graph.
   - Create CIBC as a separate workspace.
   - Move CIBC-specific mock income/expense flows only when they can be
     identified safely; otherwise use the fresh CIBC fixture.

Use structural validation rather than assuming every version 4 local record
already has the final workspace shape.

## Files Currently Partially Changed

Review these before continuing:

- `src/features/money-flow/types.ts`
- `src/features/money-flow/calculations.ts`
- `src/features/money-flow/mock-data.ts`
- `src/features/money-flow/repository.ts`
- `src/features/money-flow/canvas-types.ts`
- `src/features/money-flow/components/money-summary.tsx`
- `src/features/money-flow/components/cash-flow-table.tsx`
- `src/features/money-flow/components/money-flow-workspace.tsx`
- `src/features/money-flow/components/money-inspector.tsx`

Do not blindly revert unrelated fixes in these files, including month
forecasting, table overflow containment, hydration-safe theming, direct canvas
interactions, and user-scoped persistence.

## Acceptance Criteria

- Account selector contains Scotiabank Chequing and CIBC Chequing.
- Switching accounts visibly loads a different canvas graph.
- Each account has an independently editable first-month opening balance.
- Each account carries its own ending balance into its next month.
- Canvas mutations persist only to the selected account.
- Table rows and totals match the selected account's canvas summary.
- Switching away and back restores node positions and viewport.
- Existing version 3 local data migrates without losing the original graph.
- The dashboard never horizontally overflows when the table scrolls.
- Homepage theme hydration remains error-free.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deferred Work

- Convex persistence.
- Authentication-backed user identity.
- Atomic editing of linked inter-account transfer pairs.
- Consolidated all-accounts/net-worth view.
- Reconciliation with real bank transactions.
