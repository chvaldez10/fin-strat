# Personal Dashboard

The Next.js app for a personal workspace that brings money, notes, and daily signals together. See the [repository overview](../README.md) for what works today and a project map.

## Get started

Requires Node.js 24+ and pnpm 11.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Commands

| Command             | Purpose                         |
| ------------------- | ------------------------------- |
| `pnpm dev`          | Start the development server.   |
| `pnpm lint`         | Run Oxlint.                     |
| `pnpm typecheck`    | Check types with TypeScript 7.  |
| `pnpm format:check` | Check formatting with Prettier. |
| `pnpm build`        | Create a production build.      |
| `pnpm start`        | Serve a production build.       |

The money-flow [architecture notes](./docs/technical/money-flow-canvas.md) describe its data model and canvas behavior.
