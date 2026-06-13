# Money Flow Canvas Technical Design

## Purpose

This document describes the implemented money-flow canvas at
`/dashboard/watchlist/money-flow`. It complements the original
[feature plan](../plans/money-flow-canvas.md) with the current architecture,
data contracts, interaction behavior, persistence model, and extension points.

The tool models a single monthly CAD scenario centered on a protected Chequing
account. React Flow handles canvas interaction, while application-owned domain
types remain independent from React Flow and future database providers.

## Architecture

The feature is organized into four layers:

1. **Domain model**
   - `types.ts` defines persisted records and repository contracts.
   - `calculations.ts` derives financial totals without UI dependencies.
   - `validation.ts` contains connection rules.

2. **Persistence and fixtures**
   - `mock-data.ts` creates a complete user-owned demo document.
   - `repository.ts` implements the repository contract using user-scoped
     `localStorage`.
   - `features/auth/mock-session.ts` supplies the current mock user.

3. **Canvas adapter**
   - `canvas-types.ts` maps domain nodes and transfers to React Flow nodes and
     edges.
   - React Flow-specific selection and display properties are not persisted in
     the domain model.

4. **Presentation and interaction**
   - `money-flow-workspace.tsx` owns the editor instance, persistence
     boundaries, history, and commands.
   - Small components render nodes, edges, summary values, tools, inspector,
     and the node context menu.

## Domain Model

The persisted root record is `MoneyFlowDocument`:

```ts
type MoneyFlowDocument = {
  id: string;
  userId: string;
  version: 2;
  currency: "CAD";
  scenario: {
    name: string;
    startingBalanceCents: number;
  };
  nodes: MoneyFlowNode[];
  transfers: MoneyFlowTransfer[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
};
```

All monetary values use integer cents. This avoids floating-point rounding
errors and maps cleanly to database numeric fields.

### Nodes

`MoneyFlowNode` represents a financial place or a visual note:

- `chequing`: the protected center account.
- `income`: a source that can send but not receive money.
- `expense`: a destination that can receive but not send money.
- `account`: an intermediate or destination account.
- `note`: visual annotation that cannot connect to transfers.

Nodes own their label, optional note, and canvas position. They do not own flow
amounts.

### Transfers

`MoneyFlowTransfer` represents a directed monthly movement:

```ts
type MoneyFlowTransfer = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  monthlyAmountCents: number;
  label?: string;
};
```

Amounts belong to transfers because the same account may participate in
multiple flows with different values.

### Chequing Balance

The editable starting balance remains on `scenario.startingBalanceCents`,
rather than React Flow node data. The Chequing node receives starting and
projected balances as derived display fields.

The current calculation is:

```text
projected balance =
  starting balance
  + transfers directly into Chequing
  - transfers directly out of Chequing
```

Transfers between secondary accounts remain visible but are not counted again.

## User Ownership And Persistence

The mock session exposes one current user:

```ts
{
  id: "user_chris_demo",
  name: "Chris",
  email: "personal dashboard",
  initials: "CH"
}
```

Every document contains that user's ID, and local storage uses:

```text
personal-dashboard:money-flow:{userId}
```

The local repository is created for one user and rejects attempts to save a
document owned by another user.

Version 2 migrates the previous unscoped version 1 record once, assigning it to
the current mock user and removing the legacy key.

The repository boundary is:

```ts
type MoneyFlowRepository = {
  userId: string;
  load(): MoneyFlowDocument;
  save(document: MoneyFlowDocument): void;
  reset(): MoneyFlowDocument;
};
```

A future Convex implementation should satisfy this behavioral contract. It may
make the methods asynchronous when the application adopts server-backed
loading and mutation states.

## Canvas State And Performance

React Flow runs in uncontrolled mode. The workspace keeps a
`ReactFlowInstance` ref and uses imperative methods to read or update nodes,
edges, and viewport state.

This avoids placing rapidly changing drag and viewport state in the dashboard
page's React state. As a result:

- Node dragging updates React Flow's internal store.
- Panning and zooming do not rerender the summary or inspector.
- Domain totals recalculate only after financial mutations.
- Custom node and edge renderers are memoized.
- Static node types, edge types, snap grid, and edge options are module-level
  constants.
- `onlyRenderVisibleElements` enables viewport culling.

The workspace commits persistence only at semantic boundaries:

- Node drag end.
- Node or transfer creation.
- Inspector save.
- Duplicate or delete.
- Undo or redo.
- Viewport move end.
- Demo reset.

Undo and redo store complete domain document snapshots and retain at most 50
entries. Live pointer movement is never added to history.

## Interaction Model

The editor uses direct manipulation rather than persistent tool modes:

- Left click selects a node or transfer.
- Left drag moves a node.
- Empty-canvas left drag does nothing; lasso selection is disabled.
- Right drag pans the canvas.
- Space plus drag is an alternate pan gesture.
- Mouse wheel or trackpad zooms.
- Dragging a node handle creates a transfer.
- Shift-click supports multi-selection through React Flow.
- Escape clears selection and closes transient UI.

The toolbar provides node creation, duplicate, delete, undo/redo, fit view,
zoom, and reset.

Right-clicking a node opens a canvas-positioned context menu with Duplicate and
Delete. The action receives the right-clicked node explicitly, avoiding races
with selection state. Chequing is selected but cannot be duplicated or deleted.

## Validation Rules

A transfer is rejected when:

- Source and target are the same node.
- Either endpoint is a note.
- An expense is the source.
- An income node is the target.
- A transfer already exists for the same source and target.
- Either endpoint no longer exists.

New transfers default to `$100.00` per month and can be edited in the
inspector.

## Styling

The feature uses the existing Tailwind CSS variables and shadcn-style
primitives for buttons, inputs, sheets, tooltips, and layout surfaces.

React Flow supplies only canvas mechanics and its base stylesheet. Custom nodes
and controls use application tokens such as `background`, `border`,
`foreground`, `muted`, and `ring`.

Connections use orthogonal step routing with a zero border radius. They are not
animated and avoid expensive visual filters.

## Future Convex Migration

The recommended migration sequence is:

1. Replace the mock session with authenticated user identity.
2. Add a Convex document/table containing the `MoneyFlowDocument` fields or
   normalized node and transfer tables.
3. Implement a Convex-backed repository scoped by authenticated `userId`.
4. Preserve integer-cent amounts and document-version migration.
5. Introduce asynchronous loading, save status, conflict handling, and error
   feedback in the workspace.
6. Keep `canvas-types.ts` and the React Flow components unchanged unless the
   persisted schema itself changes.

Do not persist React Flow's complete node or edge objects directly. Their
internal and presentation-specific fields would couple stored data to the
canvas library and complicate future migrations.

## Verification

The implementation is currently checked with:

```bash
npm run lint
npm run typecheck
npm run build
```

Manual interaction testing should cover:

- Editing and persisting the Chequing starting balance.
- Correct projected balance after changing transfer amounts.
- Left-click selection and node dragging.
- Right-drag panning without opening a context menu after a drag.
- Right-click Duplicate and Delete actions.
- Chequing protection.
- Undo and redo after edits and movement.
- Reloading user-scoped persisted data.
- Resetting to the seeded demo.
