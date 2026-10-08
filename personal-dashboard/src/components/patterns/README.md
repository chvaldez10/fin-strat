# App Patterns

Patterns are reusable compositions built from `components/ui`, intended for use across projects.

## Use This Folder For

- Empty states.
- Error states.
- Loading states.
- Search inputs.
- Form sections.
- Hero sections.
- Future reusable app patterns such as filter bars, confirm dialogs, settings layouts, and data-table wrappers.

## Rules

- Patterns may include generic copy defaults, but must accept content customization. Project-specific copy belongs to consumers.
- Prefer patterns when two or more pages need the same structure.
- Keep patterns independent from route groups and feature-specific data.
- Do not duplicate layout shell concerns here; use `components/layout` for shell infrastructure.

Patterns forward native props, refs, and `data-testid` to their root element.
`SearchInput` forwards them to the input instead. Consumers provide its accessible
name with a label or `aria-label`. Loading states announce their label and hide
decorative skeletons from assistive technology.
