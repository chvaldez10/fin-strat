# Personal Dashboard Engineering

This project is a personal dashboard. Build its features with composability, reuse across projects, and production quality in mind. These are engineering principles, not a change to the product's purpose. Keep shared components separate from dashboard and finance domain behavior; introduce abstractions when they serve concrete use cases.

## Start here

- For shared UI, layout, styling, or component API work, use [composable-development](./.agents/skills/composable-development/SKILL.md).
- Read [architecture](./docs/engineering/architecture.md) when deciding component ownership or dependencies.
- Use [quality criteria](./docs/engineering/quality.md) to define and verify readiness. Existing components are not automatically production ready.

## Engineering rules

- Reuse existing primitives and patterns before creating another component. Prefer composition through children, slots, and small explicit variants over large configuration objects or flags for unrelated modes.
- Keep shared UI independent of routes, navigation configuration, authentication, storage, fetching, and feature data. Pass those concerns through typed props and callbacks from consumers.
- Preserve native element props, accessible semantics, relevant refs, and consumer styling hooks. Document controlled and uncontrolled behavior when both are supported.
- Use semantic theme tokens. Support keyboard use, visible focus, narrow screens, light/dark themes, and reduced motion where applicable.
- Keep client boundaries as small as behavior permits. Avoid browser APIs during module evaluation or render; verify hydration-sensitive behavior.
- Define the supported component contract and show a realistic consumer example. Validate behavior and public types with checks appropriate to the risk; lint alone does not establish readiness.
- Fix accessibility findings at their source. Any suppression must be narrowly scoped, explain the actual exception, and preserve equivalent accessible behavior.
- Do not introduce packaging, publishing, new test infrastructure, or directory reorganizations unless the task needs them. Follow the architecture doc's current consumption model.

## Commands and reference implementations

- Run commands from this directory with Node.js 24+ and the pinned pnpm 11 version. Install locally with `pnpm install`; develop with `pnpm dev`. Use `pnpm install --frozen-lockfile` for CI, deployment, or an explicit lockfile consistency check.
- For code changes, use `pnpm lint` and `pnpm typecheck`. Use `pnpm build` for framework, dependency, or rendering changes and `pnpm format:check` for formatting. For docs-only work, check the changed documents. No automated test script is currently configured; do not invent a passing test command.
- Follow `src/components/ui/button.tsx` for primitive composition and variants, `src/components/patterns/` for reusable compositions, and `src/features/money-flow/` for domain code separated from UI and persistence.

## Data and generated files

- Preserve stored finance data and document migration behavior when changing its schema. Treat data loaded from storage or external services as untrusted input.
- Authentication currently uses a mock user. If adding protected backend operations, enforce authentication and ownership on the server; a client-supplied user ID is not authorization.
- Generate `pnpm-lock.yaml` through pnpm. Do not hand-edit `.next/`, `next-env.d.ts`, or `*.tsbuildinfo`. Preserve the Next.js-managed block below.

## Working efficiently

- For long requests, identify the requested outcome and scope before using tools. Work from the named files and expand the search only when needed.
- Keep searches narrow and cap command output. Do not print full lockfiles, dependency trees, or repository-wide diffs when a focused check answers the question.
- Treat naming changes as edits to names in content and metadata. Do not infer a directory, workspace, or remote repository rename; do those only when explicitly requested.
- Avoid repeated installs, builds, and checks. Run the checks that cover the changed behavior, then stop when they pass.
- Report the result and any remaining limitation briefly. Do not repeat tool output in the final response.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
