# Composable Application Architecture

## Purpose and current state

The personal dashboard is the product. Develop its UI and features with clear boundaries so useful components and logic can be reused in other projects. Reuse is an engineering goal, not a requirement to turn every feature into a generic library. Preserve working dashboard behavior and local data while improving shared code.

## Ownership

| Location                                   | Responsibility                                                                 | Allowed dependencies                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/`                       | Generic primitives such as buttons, inputs, menus, and dialogs                 | React, Radix, styling utilities, semantic tokens, and other primitives                                        |
| `src/components/patterns/`                 | Reusable compositions such as empty states, form sections, and search controls | Primitives and generic utilities; customizable content and callbacks                                          |
| `src/components/layout/`                   | Layout building blocks and dashboard shells                                    | Generic building blocks stay independent of application configuration; route-aware shells own app integration |
| `src/lib/`, `src/hooks/`, `src/styles/`    | Shared utilities, generic hooks, and theme support                             | No feature or route imports in reusable modules                                                               |
| `src/features/`, `src/app/`, `src/config/` | Dashboard behavior, routes, data, and navigation                               | Consume shared UI; own persistence, auth, and domain decisions                                                |

Dependencies flow from consumers to patterns to primitives. Shared UI must not import feature or route modules. Extract a reusable layout from an app shell only when a concrete consumer needs it. Keep domain calculations independent of rendering and persistence where useful; keep adapters at feature boundaries.

## Component contracts

- Choose one semantic responsibility per component. Compose distinct responsibilities instead of adding unrelated modes.
- Preserve native props where the component represents a native element. Define custom props explicitly and avoid `any` or broad index signatures that hide API mistakes.
- Use children and named slots for content customization. Use typed variants for stable visual differences. Keep defaults useful without embedding project names, routes, or domain copy.
- Pass actions and values through callbacks and props. Document callback payloads, defaults, and controlled/uncontrolled ownership; avoid silently switching ownership.
- Forward relevant refs and native event handlers. If composing handlers, define ordering and honor cancellation where the underlying primitive expects it.
- Maintain established Radix/shadcn composition conventions. Verify `asChild` behavior with a realistic consumer; do not assume every custom child forwards props and refs.
- Keep styling extensible through `className`, existing `data-slot` attributes, and semantic CSS variables. New shared tokens need a clear purpose and defaults across supported themes.

## Mobile-first design

- Start with the smallest useful layout and the user's primary task. Keep essential information and actions available on narrow screens; use additional space to improve scanning and efficiency.
- In Tailwind, write the mobile layout with unprefixed utilities and add breakpoint overrides as content requires. Choose breakpoints where the layout stops working, rather than assuming a particular device. Prefer flexible grids, wrapping, and intrinsic sizing over fixed widths.
- Keep one source of state and a logical reading/focus order across layouts. Prefer CSS layout changes; use JavaScript viewport detection only when behavior genuinely needs it, with a stable server-rendered fallback.
- Make primary controls comfortable to tap; aim for 44px targets where practical. Provide visible alternatives to hover, drag, and context-menu actions. Preserve keyboard access and clear labels for icon controls.
- Keep page content within the viewport. Dense tables and spatial canvases may scroll within a clearly bounded area; retain their headers, labels, and access to actions. Do not use global overflow clipping to conceal layout defects.
- Account for long text, empty/loading/error states, zoom, mobile keyboards, dynamic viewport height, and safe areas when relevant. Fixed panels must leave focused inputs and primary actions reachable.
- Verify the changed flow at a narrow phone width, a wider layout, and any breakpoint that changes behavior. Include touch and keyboard interactions; a desktop screenshot alone is insufficient.

## Frontend design judgment

The goal is a polished, reliable experience with maintainable code. Make decisions from the actual task and evidence rather than adding complexity to look sophisticated.

- Establish the main user action and information hierarchy before implementation. Reuse the existing typography, spacing, colors, and component vocabulary; introduce a new pattern when existing ones cannot express the need clearly.
- Design complete interactions: feedback, validation, pending/success/failure states, recovery, and focus behavior. Preserve user input through recoverable failures and prevent unintended duplicate actions.
- Keep state close to its owner and derive values where possible. Separate domain calculations from rendering so correctness can be verified without mounting the interface.
- Keep high-frequency work such as canvas dragging isolated from unrelated UI. Measure rendering or loading problems before adding memoization, caching, or new dependencies; avoid shipping unnecessary client code.
- Review the result in the actual interface, including realistic content and relevant themes. Use the [quality criteria](./quality.md) to collect evidence, and explain meaningful tradeoffs or unverified behavior.

## Test selectors

- Prefer selectors based on accessible roles, names, and labels when they identify the intended behavior. Use `data-testid` for elements that need a stable testing hook, such as canvas nodes or controls whose text changes dynamically. Do not add IDs to every element.
- Use descriptive kebab-case names tied to purpose, such as `money-flow-add-income`. Avoid styling details, array indexes, translated copy, and random values. For repeated items, scope queries within an item or use a stable domain identifier when necessary; never embed sensitive data.
- Shared components must accept and forward consumer-supplied `data-testid` attributes to the relevant DOM element. Assign feature-specific IDs in consumers. For composed components, document which element receives the ID and expose additional hooks only when a test needs them.
- Keep IDs stable across layout and styling changes. Treat an ID used by tests as a contract; update affected tests deliberately if the underlying behavior changes. Test IDs do not replace accessible names or semantic HTML.

## Consumption

When a component is reused outside this app, document the required files, imports, styles/tokens, libraries, and client/provider requirements. Local `@/` aliases, Geist variables, and Next.js imports are application assumptions that must be documented or removed from a portable component's dependencies. Ordinary dashboard features do not need an export or distribution layer.

Do not claim a component works in an arbitrary React project until its dependency path and a representative consumer have been verified. Framework-specific adapters should be identified clearly. A future package/export design is a separate task and should establish supported runtimes, peer dependencies, CSS delivery, and versioning before publishing.

## Changes to an existing API

Find actual consumers before changing props, defaults, exported types, or markup semantics. Preserve existing behavior where practical. When a breaking change is needed, update affected examples and document the migration. Do not add compatibility layers for hypothetical consumers.
