# Lib

This folder contains shared utilities and framework-agnostic support code.

## Current Responsibilities

- `utils.ts`: small shared utilities such as `cn`.
- `design/`: typed design-system intent, including typography, spacing, radius, shadows, animation, containers, and breakpoints.

## Rules

- Keep utilities small, stable, and reusable.
- Do not place route-specific logic here.
- Do not place component implementations here.
- Prefer `lib/design/tokens.ts` for shared design values instead of scattering constants through components.
