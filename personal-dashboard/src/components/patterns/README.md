# App Patterns

Patterns are reusable product-facing compositions built from `components/ui`.

## Use This Folder For

- Empty states.
- Error states.
- Loading states.
- Search inputs.
- Form sections.
- Hero sections.
- Future reusable app patterns such as filter bars, confirm dialogs, settings layouts, and data-table wrappers.

## Rules

- Patterns may include app-level copy defaults, but should still accept props for customization.
- Prefer patterns when two or more pages need the same structure.
- Keep patterns independent from route groups and feature-specific data.
- Do not duplicate layout shell concerns here; use `components/layout` for shell infrastructure.
