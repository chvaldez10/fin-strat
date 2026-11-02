# Personal Dashboard

**A quieter place to keep life in view.**

A personal workspace for money, notes, reminders, and daily signals. Built with composable components and production quality in mind, so useful pieces can be reused in other projects.

For development guidance, see the [architecture](./personal-dashboard/docs/engineering/architecture.md) and [quality criteria](./personal-dashboard/docs/engineering/quality.md).

`Next.js 16` · `React 19` · `TypeScript 7` · `Tailwind CSS 4` · `pnpm 11`

## What you can do

| Space                  | What is there today                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Money Flow**         | Private account workspaces, canvas/table planning, recurring schedules, atomic linked transfers, and revision-aware Convex saves. |
| **Watchlist**          | Private saved notes, quick capture, and explicit import of browser backups.                                                       |
| **Overview**           | Counts and recent notes from your saved data.                                                                                     |
| **Settings & profile** | Persisted preferences, real user details, sign-out, and administrator-managed invitations.                                        |

Accounts are invitation-only. Data is private to each authenticated user. Legacy
browser records stay intact as explicit migration backups. Additional trackers
are planned.

## Run locally

Requires **Node.js 24+** and **pnpm 11**. From the repository root:

```bash
cd personal-dashboard
corepack enable
pnpm install
pnpm dev --hostname 127.0.0.1
```

Configure the backend environment and obtain an invitation using the
[app setup guide](./personal-dashboard/README.md). Open [localhost:3000](http://localhost:3000), sign in, then go to `/dashboard` for the overview or `/dashboard/watchlist/money-flow` for the interactive canvas.

## Project map

```text
personal-dashboard/
├── src/app/                 Routes and layouts
├── src/features/money-flow/ Canvas, calculations, and Convex persistence
├── src/features/watchlist/  Watchlist and quick capture
├── src/components/          Shared UI and layout
├── src/config/              Site and navigation settings
└── docs/                    Architecture and integration records
```

The [app README](./personal-dashboard/README.md) has the development commands. For the money-flow implementation, see the [architecture notes](./personal-dashboard/docs/technical/money-flow-canvas.md).
