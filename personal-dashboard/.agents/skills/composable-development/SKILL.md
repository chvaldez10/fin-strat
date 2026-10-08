---
name: composable-development
description: Build, refactor, or review shared UI primitives, patterns, layouts, and component APIs in the personal dashboard with composability and production quality in mind.
---

# Composable Development

Support the personal dashboard's actual features while making useful shared pieces composable and reusable. Do not reinterpret the project as a UI kit or abstract domain behavior without a concrete need.

1. Inspect the affected component and its actual consumers. Reuse established primitives and composition conventions. Read [architecture](../../../docs/engineering/architecture.md) when choosing ownership or changing dependencies.
2. Define the smallest useful public API: content slots, native props, refs, variants, state ownership, and callbacks as applicable. Keep routes, auth, storage, fetching, and domain models in consumers.
3. Implement the requested behavior with semantic tokens and accessible interaction. Keep framework and client requirements explicit. Preserve existing consumers or update them with a documented migration.
4. Verify the changed contract in the affected dashboard usage or another concrete consumer. Add an example when it helps document reuse. Choose validation from [quality criteria](../../../docs/engineering/quality.md), including relevant states, keyboard behavior, and intended consumer assumptions.
5. Report the resulting API/behavior, verification, and remaining limitations briefly. Do not infer package publishing, directory renames, or a repo-wide refactor from a component task.

Read only the references and framework docs needed for the current change. Prefer focused behavioral or public-type checks over tests that mirror implementation details.
