# Source Structure

This project is a Next.js personal dashboard. Keep the source tree organized by responsibility so the app can scale without mixing routing, reusable UI, and personal tracking features.

## Folder Responsibilities

- `app/`: Next.js App Router routes, route groups, layouts, loading states, error boundaries, and route handlers.
- `components/ui/`: low-level shadcn/Radix primitives. Keep these generic and reusable.
- `components/patterns/`: reusable app patterns composed from primitives, such as empty states, loading states, form sections, and search inputs.
- `components/layout/`: public and dashboard shell components.
- `config/`: typed site, navigation, and shell configuration.
- `hooks/`: shared React hooks used by client components.
- `lib/`: framework-agnostic utilities and design-system definitions.
- `styles/`: global theme support that does not belong to a single route.

## Ground Rules

- Prefer server components by default. Add `"use client"` only for browser APIs, state, effects, or interactive Radix components.
- Keep business or product-specific logic out of `components/ui/`.
- Prefer composition over one-off page markup when a pattern appears more than once.
- Keep routes thin: pages should compose layouts, patterns, and primitives instead of owning reusable UI logic.
- Add new shared constants to `config/` or `lib/design/` instead of scattering hardcoded values.
