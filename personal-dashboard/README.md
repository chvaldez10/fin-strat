# Personal Dashboard

The Next.js personal dashboard for money, notes, and daily signals. Build features with composability and production quality in mind. See the [repository overview](../README.md) for current features, and the [architecture](./docs/engineering/architecture.md) and [quality criteria](./docs/engineering/quality.md) for engineering guidance.

## Get started

Requires Node.js 24+ and pnpm 11.

```bash
corepack enable
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Commands

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Start the development server.                    |
| `pnpm lint`         | Run Oxlint.                                      |
| `pnpm typecheck`    | Check types with TypeScript 7.                   |
| `pnpm test`         | Run finance and watchlist data regression tests. |
| `pnpm format:check` | Check formatting with Prettier.                  |
| `pnpm build`        | Create a production build.                       |
| `pnpm start`        | Serve a production build.                        |

The money-flow [architecture notes](./docs/technical/money-flow-canvas.md) describe its data model and canvas behavior.
