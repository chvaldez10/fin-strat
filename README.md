# Personal Dashboard

**A quieter place to keep life in view.**

A personal workspace for the small things that are easy to lose track of: money, notes, reminders, and whatever deserves a second look. Built as a Next.js app with a focused, adaptable UI.

`Next.js 16` · `React 19` · `TypeScript 7` · `Tailwind CSS 4` · `pnpm 11`

## What you can do

| Space                   | What is there today                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Money flow**          | Arrange income, expenses, and transfers on a canvas; switch to a monthly cash-flow table; inspect projected balances. Changes are saved in browser storage. |
| **Watchlist**           | Capture short notes and revisit a set of sample items. Quick-capture notes are saved in browser storage.                                                    |
| **Overview**            | Scan a sample snapshot of priorities, upcoming dates, habits, and money.                                                                                    |
| **Trackers & settings** | Explore the UI for future personal trackers and preferences. These screens currently use sample content or in-memory state.                                 |

The app uses a mock user. Browser storage is local to the current device; account sync and persistent settings are not implemented yet.

## Run locally

Requires **Node.js 24+** and **pnpm 11**. From the repository root:

```bash
cd personal-dashboard
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Go straight to `/dashboard` for the overview or `/dashboard/watchlist/money-flow` for the interactive canvas.

## Project map

```text
personal-dashboard/
├── src/app/                 Routes and layouts
├── src/features/money-flow/ Canvas, calculations, and local persistence
├── src/features/watchlist/  Watchlist and quick capture
├── src/components/          Shared UI and layout
├── src/config/              Site and navigation settings
└── docs/                    Feature architecture and future plans
```

The [app README](./personal-dashboard/README.md) has the development commands. For the money-flow implementation, see the [architecture notes](./personal-dashboard/docs/technical/money-flow-canvas.md).
