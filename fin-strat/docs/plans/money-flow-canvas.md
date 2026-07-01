# Interactive Money Flow Canvas

## Summary

Build a working demo at `/dashboard/watchlist/money-flow` using
`@xyflow/react`. It will model monthly CAD cash flow through a central
Chequing account, persist locally, and leave Convex/BaaS integration for later.

React Flow will run in uncontrolled mode so dragging and viewport movement
remain inside its internal store. Follow the React Flow uncontrolled-flow and
performance guidance throughout the implementation.

## Experience

- Keep the dashboard sidebar and global header, but make the money-flow
  workspace full-height beneath them.
- Add a top summary bar showing starting balance, monthly inflow, monthly
  outflow, and projected month-end balance.
- Add an account selector that switches between independent account
  workspaces. Each workspace owns its graph, balance forecast, and viewport.
- Provide a left tool dock with select, pan, income, expense, account, note,
  connector, duplicate, delete, undo/redo, fit view, zoom, and reset demo.
- Support dragging node types from the dock onto the canvas.
- Use a square grid, 16px snapping, alignment guides, and strictly orthogonal
  connectors with zero curve radius.
- Open a right inspector for the selected node or connector. On mobile, use a
  bottom sheet.
- Include keyboard controls for delete, duplicate, undo/redo, multi-select,
  temporary spacebar panning, and escape.

## Data And Calculations

- Boxes represent `chequing`, `income`, `expense`, `account`, or `note`.
- Connectors represent monthly movement and own `monthlyAmountCents`, an
  optional label, source, and target.
- Calculate each tracked account month as:
  `opening balance + direct incoming flows - direct outgoing flows`.
- Carry each month-end balance forward as the next month's opening balance.
- Represent account-to-account movement as linked outgoing and incoming flows
  in the respective account workspaces.
- Give transfers a recurring monthly amount, active month range, and optional
  month-specific amount overrides.
- Keep secondary paths visible without double-counting money already
  transferred out of Chequing.
- Reject self-connections, note connections, duplicate source-target
  connections, incoming connections to income nodes, and outgoing connections
  from expense nodes.
- Seed mock data for paycheque, side income, rent, utilities, groceries,
  savings, and investing.
- Persist a versioned, user-owned `MoneyFlowDocument` containing its document
  ID, user ID, forecast range, selected account, view mode, account
  workspaces, currency, and scenario data in user-scoped
  `localStorage`.
- Autosave only after semantic actions such as drag-end, connect, edit, delete,
  undo/redo, or viewport move-end.
- Recover from corrupt or incompatible local data by loading the demo graph and
  showing a non-blocking notice.
- Keep storage behind `loadMoneyFlow`, `saveMoneyFlow`, and `resetMoneyFlow`
  functions so Convex can replace local storage later without changing canvas
  components.

## Performance Architecture

- Isolate the client-only canvas from the route and dashboard shell.
- Declare node types, edge types, snap grids, and static options at module
  scope.
- Wrap custom nodes and edges with `React.memo`; use stable callbacks and
  imperative React Flow instance methods.
- Do not place live nodes, edges, pointer coordinates, or viewport state in
  page-level React state.
- Recalculate header totals only after financial mutations, never during pan,
  zoom, or node movement.
- Enable viewport culling and avoid animated edges, gradients, filters, and
  heavy shadows.
- Maintain undo history as document snapshots at action boundaries, capped at
  50 entries.
- Accept necessary React Flow updates for the moved node and viewport; the
  dashboard shell, summary, inspector, and unaffected nodes must not rerender
  during dragging.

## Navigation And Testing

- Add `Money flow` beneath Watchlist and point the existing public Money link
  to it.
- Add month navigation that renders one selected month on the canvas and a
  table view that compares the complete forecast horizon.
- Unit-test totals, cents arithmetic, multi-step paths, invalid connections,
  negative balances, and local-storage recovery.
- Interaction-test drag/drop, connection creation, inspector editing,
  duplicate/delete, undo/redo, reset, reload persistence, zoom, and keyboard
  controls.
- Profile node dragging to confirm no commits occur in the dashboard shell,
  summary bar, inspector, or unaffected nodes.
- Verify desktop and mobile layouts with screenshots; mobile uses a compact
  tool strip and inspector sheet.
- Run lint, typecheck, production build, and a 100-node/150-edge stress fixture
  before completion.

## Assumptions

- Currency is CAD and the forecast starts with 12 monthly periods.
- Amounts live on connectors, not boxes.
- No authentication, collaboration, import/export, automatic bank feeds, or
  Convex integration is included.
- A mock current user owns the document until authentication is connected.
- The current app does not contain the Convex package or generated `convex/`
  directory, so this demo only prepares a replaceable persistence boundary.

## References

- [React Flow uncontrolled flow](https://reactflow.dev/learn/advanced-use/uncontrolled-flow)
- [React Flow performance](https://reactflow.dev/learn/advanced-use/performance)
