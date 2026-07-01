# Money Flow Architecture

## Scope

This document describes the implemented architecture of the money-flow feature
at `/dashboard/watchlist/money-flow`. It is the reference for current behavior
and code ownership.

Future Convex work is intentionally kept in
[`../plans/money-flow-convex-integration.md`](../plans/money-flow-convex-integration.md).

## Design Goals

- Keep financial records independent from React Flow.
- Render one bank account workspace at a time.
- Derive canvas and table totals from the same calculation functions.
- Keep pointer movement inside React Flow so the dashboard does not rerender
  during dragging or panning.
- Persist only at semantic action boundaries.
- Keep mock fixtures and local persistence replaceable.

## Route And Feature Boundary

```text
src/app/(dashboard)/dashboard/watchlist/money-flow/page.tsx
  -> MoneyFlowWorkspace
     -> domain calculations and validation
     -> React Flow canvas adapter
     -> local repository
```

The route owns metadata and full-bleed page layout only. Feature code lives in
`src/features/money-flow`.

## File Ownership

### Domain

- `types.ts`: persisted domain contracts and repository contract.
- `months.ts`: `YearMonth` arithmetic and formatting.
- `calculations.ts`: pure monthly forecast and currency formatting.
- `validation.ts`: graph connection rules.

### Persistence

- `mock-data.ts`: deterministic account workspace fixtures.
- `repository.ts`: user-scoped localStorage adapter only.
- `persistence/document-codec.ts`: runtime decoding, structural validation,
  legacy migrations, and narrowly scoped data repair.

The codec accepts `unknown` and is the only path from untrusted stored JSON to
`MoneyFlowDocument`.

### Canvas Adapter

- `canvas-types.ts`: conversion between domain records and React Flow nodes and
  edges.
- React Flow-only fields such as `selected`, `hidden`, and rendered balance
  data never enter the persisted schema.

### Workspace And Presentation

- `components/workspace/money-flow-workspace.tsx`: editor orchestration,
  commands, persistence boundaries, and React Flow instance ownership.
- `components/workspace/workspace-document.ts`: selected-account lookup and
  canvas projection helpers.
- `components/workspace/use-money-flow-history.ts`: dormant, isolated history
  implementation retained for a possible future undo/redo feature. It is not
  connected to the current editor.
- Other files under `components/`: focused visual controls for the summary,
  account switcher, table, nodes, edges, inspector, context menu, and tool dock.

## Persisted Domain Model

```ts
type MoneyFlowDocument = {
  id: string;
  userId: UserId;
  version: 4;
  currency: "CAD";
  scenario: {
    name: string;
    startMonth: YearMonth;
    forecastMonthCount: number;
  };
  accounts: MoneyFlowAccountWorkspace[];
  view: {
    selectedMonth: YearMonth;
    selectedAccountId: string;
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
  viewport: { x: number; y: number; zoom: number };
};
```

An account is the workspace boundary. Scotiabank and CIBC do not coexist as
bank nodes in one graph. Each account owns its graph, opening balance, and
viewport.

Money uses integer cents. Dates use a zero-padded `YYYY-MM` value. Stored JSON
is runtime-validated before use, including graph endpoints and center-node
membership.

## Transfer Model

Transfers own recurring amounts and schedules:

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

An account-to-account movement is represented by one outgoing transfer in the
source workspace and one incoming transfer in the destination workspace.
`linkedTransferId` preserves their relationship. Editing both halves
atomically is not implemented in the mock stage.

## Forecast Invariant

For each account and forecast month:

```text
ending balance =
  opening balance
  + direct transfers into centerNodeId
  - direct transfers out of centerNodeId

next opening balance = current ending balance
```

The canvas summary and cash-flow table both call
`calculateMoneyFlowForecast`. UI components must not implement separate money
math.

## State Ownership

The feature has three state categories:

1. **Domain document**
   - `documentRef` is the current mutable snapshot used by commands.
   - `activeDocument` triggers React updates for the table, header, and account
     metadata after a semantic change.

2. **Canvas interaction state**
   - React Flow's internal store owns live node positions, edges, selection,
     and viewport movement.
   - The dashboard does not mirror live pointer state into React state.

3. **Presentation state**
   - Selected inspector item, context menu, month, account, and view mode are
     small React states.

This split is deliberate. Moving a node must not rerender the page shell,
summary, or every unaffected node.

## Command And Save Flow

```text
user action
  -> mutate React Flow instance
  -> read selected workspace from the instance
  -> convert through canvas-types.ts
  -> save MoneyFlowDocument through repository.ts
  -> recalculate selected account totals
```

Persistence occurs after:

- Node create, duplicate, delete, or drag stop.
- Transfer create, edit, or delete.
- Opening-balance or node edit.
- Viewport move end.
- Account, month, or Canvas/Table change.
- Demo reset.

Month navigation is projection-only. It never serializes transfer amounts out
of the canvas. This prevents display navigation from mutating financial data.

## Canvas Interaction Contract

- Left tap/click opens the selected node or edge inspector.
- Left drag moves a node without opening the mobile inspector.
- Empty-canvas left drag does not create a lasso.
- Right drag pans.
- Space plus drag is an alternate pan gesture.
- Right click opens Duplicate/Delete for a node.
- The center chequing node cannot be duplicated or deleted.
- Connections use orthogonal step routing.

## Local Persistence

The current storage key is:

```text
personal-dashboard:money-flow:{userId}
```

`repository.ts` rejects cross-user saves. `document-codec.ts` supports legacy
versions 1-3 and the temporary shared-graph version 4 shape. Invalid records
fall back to demo data.

The current `MoneyFlowRepository` is synchronous because localStorage is
synchronous. It is not intended to disguise network I/O. Convex integration
must introduce explicit loading, saving, error, and conflict states rather
than pretending the existing methods are asynchronous drop-in replacements.

## Current Limitations

- One mock user and local browser persistence.
- No server authentication or authorization.
- No collaboration or conflict resolution.
- Linked account transfers are not edited atomically.
- No import from bank transactions.
- Undo/redo is not exposed; dormant implementation logic is isolated in the
  workspace folder.
- Automated domain and interaction tests are not yet configured.

## Extension Rules

- Keep React Flow types out of `types.ts` and database records.
- Keep calculations pure and shared by every presentation.
- Decode untrusted persistence data before it reaches the workspace.
- Persist integer cents, never formatted currency strings.
- Add schema versions and migrations for persisted shape changes.
- Save one account workspace at a time when server persistence is introduced.
- Do not save on every pointer-move event.

## Verification

Current automated checks:

```bash
npm run lint
npm run typecheck
npm run build
```

Manual verification should cover account switching, month carry-forward,
opening-balance edits, node and transfer commands, mobile drag versus tap,
contained table scrolling, viewport restoration, reload persistence, and demo
reset.
