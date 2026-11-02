# Personal Dashboard

A private home for notes and monthly cash-flow planning, built with composable
components and production quality in mind.

`Next.js 16` � `React 19` � `TypeScript 7` � `Convex Auth` � `pnpm 11`

## Run locally

Requires Node.js 24+ and the pinned pnpm version. From this app directory:

```bash
corepack enable
pnpm install
```

Copy `.env.example` to ignored `.env.local`, using the configured dashboard:

```dotenv
CONVEX_DEPLOYMENT=prod:tremendous-wren-397
NEXT_PUBLIC_CONVEX_URL=https://tremendous-wren-397.convex.cloud
```

```bash
pnpm dev --hostname 127.0.0.1
```

Open [localhost:3000](http://localhost:3000). Registration is invitation-only.
No mock account or sample finance plan is created automatically.

## Backend and hosting

The configured project is `christian-valdez:personal-dashboard`, deployment
`tremendous-wren-397`. Its database is separate from personal-site. Use this same
public Convex URL for local development, frontend previews and hosted frontend
environment settings. No staging database or data-copy workflow is needed.

Sign in to the Convex CLI with an authorized deployment operator account before
running backend administration commands. Deploy from this directory:

```bash
pnpm typecheck
pnpm exec convex deploy --yes --typecheck disable
```

This targets the selected production dashboard. Check the target printed by the
CLI before publishing. Do not run `convex dev` to provision another deployment.
The frontend host builds with `pnpm install --frozen-lockfile` and `pnpm build`.
Set `NEXT_PUBLIC_CONVEX_URL` in that host; backend signing keys stay in Convex.

For a newly created dashboard deployment, configure its auth keys once:

```bash
node scripts/setup-auth.mjs
```

The script generates JWT_PRIVATE_KEY/JWKS and sets them in Convex without printing
private values. It preserves existing keys and refuses a partially configured
pair. Do not rotate signing keys just to rerun setup. The checked-in auth config
uses that deployment's own `CONVEX_SITE_URL`; no personal-site credentials are used.

## Accounts and recovery

The initial administrator invitation is generated only while no admin exists:

```bash
node scripts/create-initial-invite.mjs
```

The one-time signup path is saved in ignored `.local/initial-invitation.json`.
Open that path on your dashboard origin and choose your own name, email and
12�128 character password. The initial link expires after seven days. Keep it
private. On an already configured app, use your existing account instead.

Administrators create email-bound member invitations in `/user/profile`, then
privately send the generated link to the intended recipient. Registration and
invitation redemption are enforced on the backend. Links are single-use.

Profile also creates one-hour password recovery links. No email service is
configured; deliver links privately. If the sole administrator is locked out,
a deployment operator can run:

```bash
node scripts/create-recovery-link.mjs account-email
```

Open the path in ignored `.local/recovery-link.json`. Recovery replaces the
password and invalidates prior sessions. Remove private link files after use.
Do not commit `.local`, signing keys, passwords, or deployment credentials.

## Your data

Money Flow opens to your bank accounts list. Select an existing account to reopen
its workspace, or explicitly add another bank account. Each workspace has its own
URL, graph, and viewport; its back-to-list action flushes pending saves before
leaving. Monthly schedules, zero overrides, carry-forward balances and canvas/table
calculations use integer cents. The backend owns all private data.

Money Flow no longer displays browser-data recovery controls. Existing browser
backups, including the old `user_chris_demo` key, remain untouched. The authenticated
import API is retained for deliberate recovery; it never automatically assigns
browser data to the signed-in user. Imports are idempotent and replacing a server
plan requires explicit intent and matching revisions.

Watchlist Quick Capture and preferences also persist privately. Watchlist
provides explicit import of old browser notes. Theme remains a device preference.
Overview displays saved counts and notes; additional trackers are planned.

Keep failed/pending edits open and retry before navigating away. Conflicts offer
explicit server reload or local-version save. The app does not merge concurrent
graphs, sync bank transactions, send reminder emails, or send push notifications.

## Checks

| Command             | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `pnpm lint`         | Oxlint checks                                                |
| `pnpm typecheck`    | TypeScript 7                                                 |
| `pnpm test`         | Existing finance, migration, queue and watchlist regressions |
| `pnpm format:check` | Prettier formatting                                          |
| `pnpm build`        | Production frontend build                                    |
| `pnpm start`        | Serve the production frontend                                |

Keep existing tests passing. New unit tests or harnesses are added only on
explicit request; normally verify the changed browser flow and relevant checks.

See [architecture](./docs/engineering/architecture.md),
[quality criteria](./docs/engineering/quality.md),
[Money Flow internals](./docs/technical/money-flow-canvas.md), and the
[integration record](./docs/plans/money-flow-convex-integration.md).
