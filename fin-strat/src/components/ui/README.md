# UI Primitives

This folder contains low-level shadcn/Radix-style primitives.

## Use This Folder For

- Buttons, inputs, dialogs, sheets, menus, sidebars, breadcrumbs, skeletons, and other foundational controls.
- Components that are generic, theme-aware, and free of app-specific copy.
- Small variant APIs that should be consistent across the app.

## Rules

- Do not add dashboard, marketing, auth, billing, or product-specific behavior here.
- Do not hardcode routes or navigation labels.
- Keep styling aligned with `globals.css` CSS variables and `lib/design/tokens.ts`.
- Wrap primitives in `components/patterns/` when building product-facing UI patterns.
