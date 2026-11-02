# Money Flow Convex Integration

## Implemented

The dashboard uses invitation-only Convex Auth and private Convex persistence.
The original proposal has been reconciled with the actual implementation.

- Project: `christian-valdez:personal-dashboard`.
- Shared production deployment: `tremendous-wren-397`.
- Public endpoint: `https://tremendous-wren-397.convex.cloud`.
- Local development and frontend hosting must use this same backend. The
  personal-site project and its database are separate and were not changed.
- Auth signing keys live in Convex deployment settings. Local public endpoint
  configuration lives in ignored `.env.local`; `.env.example` is safe to commit.

## Authentication and admission

Convex Auth Password creates real users and sessions. Registration requires a
valid, unused invitation, consumed atomically with user creation. Member links
are email-bound and expire after seven days. An initial operator-issued link
creates the first administrator; subsequent invitations require an administrator.

`src/proxy.ts` protects dashboard/profile routes and handles `/api/auth`.
Every private backend operation independently resolves the authenticated user
and enforces ownership. Shared UI has no dependency on authentication or Convex.

Profile supports name updates, sign-out, and administrator-issued invitation or
recovery links. Recovery links expire after one hour, are single-use, and
invalidate prior sessions. There is no email delivery service: administrators
must deliver links privately. A deployment operator can recover a sole admin
using `scripts/create-recovery-link.mjs`.

## Storage and fetching

`moneyFlowDocuments` holds scenario, view preferences, owner, and revision.
`moneyFlowAccounts` holds one bounded domain workspace and revision per account.
Queries subscribe to root metadata, paginated account summaries, and only the
selected account graph. Owner/document indexes constrain reads. No React Flow
objects, calculated balances, credentials, or tokens enter financial records.

Limits: 25 accounts per plan, 100 nodes and 300 transfers per workspace, 128 KB
per workspace, and 800 KB per import. Forecasts support up to 1,200 months.
Money remains integer cents; existing calculation functions power both views.

## Saving and conflicts

The editor emits completed commands and drag stops. `SaveQueue` serializes
workspace requests, coalesces newer pending snapshots, and uses acknowledged
revisions. View preferences save separately. Viewport completion is debounced
by 300 ms and flushed before account switches.

Failed requests preserve drafts and offer retry. Convex retries disconnected
requests; pending edits stay visible while waiting for reconnection. A stale
revision offers explicit server reload or an explicit save of the local version.
Clean remote changes can refresh the canvas; pending local edits are retained.
Linked-transfer financial edits and deletion update both account records in one
transaction, checking both revisions and preserving independent labels.

Creating an account does not change an existing editor's selected account.
The browser-data recovery UI has been removed. The retained import API checks
root/account revisions and requires explicit replacement intent.

## First run and migration

A new account starts empty and can create its first account workspace. There is
no automatic demo seed or fallback to browser persistence.

The original migration UI supported the authenticated user's key,
`personal-dashboard:money-flow:user_chris_demo`, and the unscoped legacy key.
That UI is now removed from Money Flow; existing browser backups remain untouched.
The authenticated import API is retained for deliberate recovery. Ownership comes
from the session, decoding uses the existing codec, and successful imports are
recorded atomically. Repeated imports are no-ops.

Legacy single-account records do not receive fabricated extra accounts. Shared
legacy graphs retain their nodes/transfers in separate account workspace copies;
direct cross-account transfers receive paired schedules. Original shared-canvas
positions and viewport are retained. Current version-four workspaces are preserved.

Watchlist notes use private paginated records with explicit browser imports.
Import batches and legacy note IDs prevent duplicates. Preferences persist per
user. Overview counts and recent notes come from saved data; future trackers
are described honestly rather than displaying invented user activity.

## Verification

Real invited administrator/member accounts verified registration, login,
ownership isolation, signed-out protection, workspace persistence, stale
revisions, paired updates/deletion and rollback, recovery-link reuse rejection,
and import idempotence. Browser verification covered imports and retained
backups/zero overrides, canvas/table agreement, failed save and retry, conflict
recovery, account switching, responsive layouts and both themes.

Temporary verification users and the internal cleanup utility are removed
before handoff. Existing unit tests remain; the project workflow does not add
new tests by default. See the app README for setup and account onboarding.

## Operational boundaries

This is account-private persistence, not bank synchronization or collaborative
graph merging. Concurrent changes require the user's explicit conflict decision.
Keep the page open while changes are pending or failed; unloading warns about
unsaved work. Save before navigating away. Browser backups remain device-local
recovery sources. There are no scheduled reminder emails or push notifications.
