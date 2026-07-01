# Money Flow Convex Integration Plan

## Status

Planned for after the local money-flow behavior and schema stabilize. Convex
is installed, but this plan does not require implementing it during the mock
stage.

The current architecture is documented in
[`../technical/money-flow-canvas.md`](../technical/money-flow-canvas.md).

## Objective

Replace mock identity and user-scoped localStorage with authenticated Convex
persistence without coupling React Flow objects to the database or changing
forecast calculations.

## Non-Goals

- Bank transaction synchronization.
- Multi-currency calculations.
- Real-time collaborative canvas editing.
- Reintroducing undo/redo.
- Net-worth aggregation across unrelated features.

## Recommended Storage Shape

Use one root document plus one aggregate record per account workspace. Do not
store the entire multi-account graph in one row, and do not normalize every
node into its own table during the first database iteration.

### `moneyFlowDocuments`

```ts
{
  ownerSubject: string,
  domainId: string,
  version: number,
  currency: "CAD",
  scenario: {
    name: string,
    startMonth: string,
    forecastMonthCount: number,
  },
  view: {
    selectedMonth: string,
    selectedAccountId: string,
    mode: "canvas" | "table",
  },
  createdAt: number,
  updatedAt: number,
}
```

Indexes:

- `by_ownerSubject`
- `by_ownerSubject_domainId`

### `moneyFlowAccounts`

```ts
{
  ownerSubject: string,
  documentId: Id<"moneyFlowDocuments">,
  accountId: string,
  institution: string,
  name: string,
  accountType: "chequing" | "savings",
  openingBalanceCents: number,
  centerNodeId: string,
  nodes: MoneyFlowNode[],
  transfers: MoneyFlowTransfer[],
  viewport: { x: number, y: number, zoom: number },
  revision: number,
  updatedAt: number,
}
```

Indexes:

- `by_documentId`
- `by_documentId_accountId`
- `by_ownerSubject`

Nested node and transfer arrays preserve the current semantic save boundary:
one selected account workspace. They can be normalized later if query or
collaboration requirements justify the added complexity.

## Identity And Authorization

- Replace `getCurrentMockUser()` with the authenticated Convex identity.
- Derive `ownerSubject` inside every query and mutation from
  `ctx.auth.getUserIdentity()`.
- Never accept an owner ID from client arguments as authorization.
- Verify that the root document and account workspace belong to the identity
  before reading or mutating them.
- Return an authorization error rather than an empty fallback for forbidden
  records.

## Convex Validators

Create reusable validators for:

- `YearMonth` strings.
- Positions and viewport.
- Node kind and node records.
- Scheduled transfers and month overrides.
- Account workspace payloads.
- Scenario and view preferences.

Server validators should mirror domain invariants from
`persistence/document-codec.ts`, including valid center-node membership and
transfer endpoint membership. Keep a domain schema version on the root record.

## Server API

### Queries

- `moneyFlow.getCurrent`
  - Authenticate.
  - Load the user's root document and account workspaces.
  - Return one assembled `MoneyFlowDocument`, or `null` if none exists.

### Mutations

- `moneyFlow.createDemo`
  - Create the initial root and seeded account workspaces only when the user
    has no document.
- `moneyFlow.saveWorkspace`
  - Accept root document ID, account domain ID, workspace fields, and expected
    revision.
  - Validate ownership and graph invariants.
  - Increment revision and update timestamps.
- `moneyFlow.saveView`
  - Persist selected month, account, and mode without replacing graph data.
- `moneyFlow.updateScenario`
  - Persist scenario changes independently from canvas data.
- `moneyFlow.saveLinkedTransfer`
  - Update both account workspaces in one mutation when linked transfer
    editing is implemented.
- `moneyFlow.resetDemo`
  - Replace only the authenticated user's money-flow records after explicit
    confirmation.

## Client Persistence Boundary

Do not make the synchronous `MoneyFlowRepository` return promises and call it
done. Introduce a client hook with explicit network state:

```ts
type MoneyFlowPersistenceState = {
  document: MoneyFlowDocument | null;
  status: "loading" | "ready" | "saving" | "error";
  error?: string;
  saveWorkspace(account: MoneyFlowAccountWorkspace): Promise<void>;
  saveView(view: MoneyFlowView): Promise<void>;
  reset(): Promise<void>;
};
```

Provide two implementations during migration:

- `useLocalMoneyFlowPersistence` for the current mock stage.
- `useConvexMoneyFlowPersistence` for authenticated server data.

The workspace should consume the hook contract and remain unaware of
localStorage or Convex function names.

## Save Behavior

- Keep React Flow uncontrolled during dragging and panning.
- Save node movement on drag stop.
- Save graph commands immediately after their semantic action.
- Debounce viewport persistence by roughly 250-400 ms after move end if actual
  usage produces excessive writes.
- Save view preferences separately from account graph data.
- Show a small save status in the header for `saving`, `saved`, and `error`.
- Keep the last server-confirmed snapshot for retry and conflict recovery.

## Concurrency

The first server version should use account-level optimistic concurrency:

- Every account workspace has a numeric `revision`.
- `saveWorkspace` receives `expectedRevision`.
- A mismatch returns the current server workspace instead of overwriting it.
- The client can offer reload or explicit overwrite; do not silently merge
  graph arrays.

This is enough for multiple tabs without implementing collaborative editing.

## Local Data Migration

On the first authenticated load:

1. Query Convex for the user's money-flow document.
2. If server data exists, use it and leave local data untouched as a temporary
   backup.
3. If server data does not exist, decode the user-scoped local record through
   `document-codec.ts`.
4. Ask the user to import the local plan or start with the demo.
5. Import the root and all account workspaces in one Convex mutation.
6. Mark the local key with the imported server document ID and timestamp.
7. Do not repeatedly import on later loads.

Keep local records for one release window before adding an explicit cleanup
action.

## Rollout Phases

### Phase 1: Persistence Contract

- Add the client persistence-state hook contract.
- Move current local behavior behind `useLocalMoneyFlowPersistence`.
- Add loading, saving, and error UI states.
- Keep behavior otherwise unchanged.

### Phase 2: Convex Schema And API

- Add schema validators and indexes.
- Implement authenticated query and mutations.
- Add domain-to-Convex mapping tests.

### Phase 3: Convex Client

- Implement `useConvexMoneyFlowPersistence`.
- Add optimistic workspace saves and revision handling.
- Preserve uncontrolled React Flow interaction.

### Phase 4: Import And Cutover

- Add the one-time local import flow.
- Compare table and canvas totals before and after import.
- Make Convex the default for authenticated users.
- Retain local fallback only during the migration window.

### Phase 5: Linked Transfers

- Add atomic two-workspace transfer editing.
- Validate that outgoing and incoming linked amounts and schedules agree.
- Surface broken links as recoverable data errors.

## Acceptance Criteria

- Authenticated users can load the same money-flow data on another device.
- Users cannot query or mutate another user's records.
- Account switching still loads independent graphs and viewports.
- Canvas and table forecasts match the local version exactly.
- Dragging and panning remain smooth and do not cause page-level rerenders.
- Failed saves remain visible and retryable.
- Revision conflicts never silently overwrite server data.
- Existing valid local documents can be imported without losing positions,
  schedules, overrides, or opening balances.
- Linked account transfers can eventually be updated atomically.
- Lint, typecheck, build, domain tests, and persistence integration tests pass.

## Testing Plan

- Unit tests for month arithmetic, forecasts, and document decoding.
- Validator tests for malformed nodes, endpoints, months, and ownership.
- Convex tests for authorization, creation, workspace saves, revisions, and
  linked-transfer atomicity.
- Import tests for legacy versions and the current version 4 document.
- Manual mobile and desktop checks for drag, tap, account switching, table
  scrolling, save status, offline failure, and reload behavior.
