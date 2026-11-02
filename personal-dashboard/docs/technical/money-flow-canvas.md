# Money Flow Architecture

The route `/dashboard/watchlist/money-flow` composes the authenticated feature.
The [integration record](../plans/money-flow-convex-integration.md) documents
backend configuration, migration, verification, and operational boundaries.

## Ownership

- `types.ts`, `months.ts`, `amounts.ts`, `calculations.ts`, `transfers.ts`, and
  `validation.ts`: framework-independent domain contracts and calculations.
- `canvas-types.ts`: domain/React Flow conversion. Selection, calculated node
  display data, and React Flow internals are never persisted.
- `components/workspace/persisted-workspace.tsx`: authenticated queries,
  onboarding, account switching, view saves, debounced viewport persistence,
  and explicit asynchronous save/conflict state.
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
- `components/workspace/local-import.tsx`: explicit browser backup discovery,
  validation, download, ownership confirmation and server import.
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

A clean remote revision refreshes the editor. A conflicting save keeps the local
canvas and offers a deliberate server reload or local-version save. Paired
transfer amount/schedule edits and deletion check both accounts and commit
atomically; the counterpart's graph, viewport and labels remain independent.

The mobile toolbar, inspector sheet, internal table scrolling and semantic theme
tokens remain part of the feature's supported presentation. Shared UI primitives
remain independent of finance, authentication, fetching and storage.

## Recovery

New users create their own first account; errors do not seed samples. Browser
imports require explicit consent, preserve original keys, validate through the
codec and commit idempotently. Replacing a server plan additionally requires
explicit confirmation and matching revisions. Legacy shared graphs retain all
nodes/edges in account workspace copies instead of dropping data.

Keep pending/failed drafts open and retry before leaving. Browser unload warns
when work is outstanding. Save before navigating to another route. See the
integration record for the completed acceptance checks and remaining boundaries.
