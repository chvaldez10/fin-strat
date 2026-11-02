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
- For code changes, use `pnpm lint` and `pnpm typecheck`. Run relevant existing tests with `pnpm test` when changing behavior they cover, and keep those tests passing. Use `pnpm build` for framework, dependency, or rendering changes and `pnpm format:check` for formatting. For docs-only work, check the changed documents.
- This is a personal project: do not add new unit tests, test suites, or test infrastructure unless the user explicitly requests them. Keep existing tests; do not delete them to simplify the workflow. Prefer focused browser/manual verification of changed behavior alongside the checks above, and report any failures honestly.
- Follow `src/components/ui/button.tsx` for primitive composition and variants, `src/components/patterns/` for reusable compositions, and `src/features/money-flow/` for domain code separated from UI and persistence.
- The shared `Button` defaults to `type="button"`. Form submission actions must explicitly set `type="submit"`; verify clicks trigger the form handler.

## Data and generated files

- Preserve stored finance data and document migration behavior when changing its schema. Treat data loaded from storage or external services as untrusted input.
- Authentication uses invitation-only Convex Auth. Enforce authentication and ownership on the server for every private operation; a client-supplied user ID is not authorization. Keep dashboard data separate from the personal-site backend.
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

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
