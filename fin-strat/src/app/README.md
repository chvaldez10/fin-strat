# App Router

This folder owns routes and route-level behavior only.

## Conventions

- Use route groups to separate shells:
  - `(public)` for marketing/public pages.
  - `(dashboard)` for dashboard pages.
- Keep root files such as `layout.tsx`, `providers.tsx`, `error.tsx`, and `globals.css` focused on app-wide behavior.
- Route pages should be small compositions of layout components, patterns, and primitives.
- Put loading and error UI in route files, but delegate reusable presentation to `components/patterns`.
- Keep route handlers under `app/api`.

## Avoid

- Do not put reusable components directly in route folders unless they are truly route-private.
- Do not add feature state or data-fetching conventions here until the feature boundary exists.
- Do not bypass established layouts for one-off page shells.
