# Layout Components

Layout components define page shells and navigation infrastructure. They should compose primitives and config, not own domain logic.

## Structure

- `public/`: navbar, footer, marketing containers, and public page sections.
- `dashboard/`: sidebar, dashboard header, breadcrumbs, and dashboard shell pieces.
- Shared layout affordances, such as the floating theme toggle, can live at this level.

## Rules

- Keep navigation data in `config/navigation.ts`.
- Keep site branding and metadata in `config/site.ts`.
- Public and dashboard layouts should remain separate.
- Do not put generic UI primitives here; use `components/ui`.
- Do not put reusable product patterns here; use `components/patterns`.
