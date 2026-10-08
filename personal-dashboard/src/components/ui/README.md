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

`Button` defaults to `type="button"`; form submit controls must explicitly use
`type="submit"`. With `asChild`, it preserves the child's native element behavior.
Button sizes use comfortable mobile targets and compact desktop dimensions;
consumers may override them with `className`. Native props, refs, and test IDs
are forwarded to the rendered control.
