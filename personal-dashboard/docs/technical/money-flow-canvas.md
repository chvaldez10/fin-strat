# Money Flow Architecture

The route `/dashboard/watchlist/money-flow` lists the user's bank accounts.
`/dashboard/watchlist/money-flow/[accountId]` opens an existing account workspace.
The list reads account summaries; only an account route subscribes to its graph.
The [integration record](../plans/money-flow-convex-integration.md) documents
backend configuration, migration, verification, and operational boundaries.

## Ownership

- `types.ts`, `months.ts`, `amounts.ts`, `calculations.ts`, `transfers.ts`, and
  `validation.ts`: framework-independent domain contracts and calculations.
- `canvas-types.ts`: domain/React Flow conversion. Selection, calculated node
  display data, and React Flow internals are never persisted.
- `components/workspace/bank-accounts-page.tsx`: account-list loading and creation
  orchestration. It does not import the canvas or workspace saving machinery.
- `components/workspace/account-workspace-page.tsx`: selected-graph loading,
  unavailable states and routing for one account workspace.
- `components/workspace/workspace-session.tsx`: editor composition, save feedback,
  recovery controls and navigation after a successful persistence flush.
- `persistence/use-money-flow-plan.ts`: authenticated plan metadata and paginated
  account summaries shared by both pages; no graph subscriptions.
- `persistence/use-workspace-persistence.ts`: live draft, acknowledged revisions,
  coalesced saves, viewport debounce, separate view writes, retries, conflict
  recovery and unload warnings. It has no route or UI dependencies.
- `persistence/workspace-writer.ts`: Convex workspace-write adapter and counterpart
  revision acknowledgements, separate from React and presentation.
- `persistence/convex-types.ts`: client data contracts derived from the backend API.
- `components/workspace/bank-account-list.tsx`: bank account cards, opening
  balances, workspace links, empty state and an explicit account-creation slot.
  This presentation component has no Convex or authentication dependency.
- `components/workspace/bank-account-list-loading.tsx`: list-route skeleton,
  distinct from the canvas workspace's loading layout.
- `components/workspace/money-flow-loading.tsx`: the same viewport-sized
  skeleton for route loading, session restoration, and selected-account queries.
  Placeholders preserve the workspace layout and expose one loading announcement.
- `components/workspace/create-account-form.tsx`: account fields, exact-cents
  validation, pending/error feedback, and an asynchronous submission callback.
  The parent supplies the Convex operation. Shared Select and MonthPicker
  controls contain no finance or persistence behavior. Existing plans supply a
  fixed start month so adding an account cannot imply a different scenario date.
- `persistence/save-queue.ts`: one serial writer per workspace, pending snapshot
  coalescing, confirmed revisions, retry, and explicit conflict decisions.
- `components/workspace/money-flow-workspace.tsx`: uncontrolled React Flow
  editor, semantic commands, inspector, month navigation and canvas/table view.
  Receives an initial document containing only the selected graph, separate
  account summaries, and callbacks; it has no identity or storage dependency.
- `persistence/document-codec.ts`: untrusted JSON validation and legacy decoding.
- `repository.ts`: read-only legacy backup access; not a runtime persistence store.
- `mock-data.ts`: test fixtures; never an automatic first-run fallback.
- `convex/moneyFlow.ts`: authenticated root/account queries, bounded writes,
  revision checks, atomic paired transfers and idempotent imports.
- `convex/validation.ts`: backend payload bounds and domain validation.

## Data model

A root holds scenario, selected view, owner and revision. Each account record
holds its own opening balance, nodes, schedules and viewport plus its revision.
The client fetches root metadata, paginated summaries, and only the selected
workspace. Account summaries never return complete graphs.

Amounts are integer cents and dates are valid `YYYY-MM`. Month overrides retain
intentional zero values. Carry-forward balances, canvas totals and table rows
come from the same pure calculation functions. Backend writes check ownership
using the authenticated user rather than imported or client-provided ownership.

## Interaction and saving

Pointer movement stays inside React Flow; drag stop and completed commands
emit domain snapshots. Only visible nodes render. The writer serializes saves
and coalesces newer snapshots while a request is in flight. It advances only
from acknowledged revisions and preserves pending data through failures.
Viewport movement completion waits 300 ms; account switching flushes it and the
active writer before loading another graph. Month/mode preferences save separately.
The workspace's back-to-list action also flushes pending graph, viewport and view
saves; failures or conflicts keep the editor open for recovery.

Inspector save buttons wait for the canvas command and server acknowledgement
before showing success. Pending forms prevent duplicate submissions; failures
retain the entered values and allow retry. Starts and Ends use the shared custom
day calendar, with an explicit clear action for an ongoing schedule. Clearing an
end month or flow label persists the removal rather than restoring the old value.

Connection lines are display-only: they cannot be selected, focused, reconnected,
edited or deleted on the canvas. All amount, date, override and label edits live
in the connected element's inspector. Income, expense and transfer destinations
edit their primary connection alongside the element's label and note; additional
connections appear as named From/To sections on the same element. The tracked
account exposes all its connections this way. Connections can be removed from
their element without deleting the element. Existing graph data is retained.

Transfers may store exact `startDate` and `endDate` values alongside their
compatible month bounds. The start day is the recurring monthly payment day;
shorter months clamp to their last day. End dates are inclusive: a month's payment
is omitted when its scheduled day falls after the end date. Existing month-only
records retain their prior calculation until the user edits their schedule; the
editor shows their first start-month day and last end-month day as defaults.
The schema addition is optional and requires no rewrite of stored records. Paired
transfers synchronize exact dates together with their amounts and month bounds.

A clean remote revision refreshes the editor. A conflicting save keeps the local
canvas and offers a deliberate server reload or local-version save. Paired
transfer amount/schedule edits and deletion check both accounts and commit
atomically; the counterpart's graph, viewport and labels remain independent.

The mobile toolbar, inspector sheet, internal table scrolling and semantic theme
tokens remain part of the feature's supported presentation. Shared UI primitives
remain independent of finance, authentication, fetching and storage.

## Recovery

New users create their own first account; errors do not seed samples. The workspace
has no browser-data recovery controls. Original browser records remain untouched;
the authenticated import API and codec remain available for deliberate recovery.
Imports commit idempotently, and replacing a server plan requires explicit intent
and matching revisions. Legacy shared graphs retain all nodes/edges in account
workspace copies instead of dropping data.

Keep pending/failed drafts open and retry before leaving. Browser unload warns
when work is outstanding. Save before navigating to another route. See the
integration record for the completed acceptance checks and remaining boundaries.
