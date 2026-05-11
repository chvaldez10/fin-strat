# Components

Components are split by abstraction level. Choose the lowest layer that matches the job, and avoid mixing responsibilities.

## Layers

- `ui/`: shadcn/Radix primitives and low-level building blocks.
- `patterns/`: reusable app patterns composed from primitives.
- `layout/`: public and dashboard shell infrastructure.

## Rules

- Do not put business logic in shared components.
- Do not import route files from components.
- Keep component props explicit and composable.
- Prefer app-facing wrappers in `patterns/` over repeating page markup.
- Keep `ui/` generic enough to move into a package later.
