# Production Quality Criteria

Production readiness is established for a component and its supported use cases. A successful application build does not verify every interaction or every downstream environment.

## Define the contract before implementing

Identify the intended consumers, public props, defaults, states, and accessibility behavior. For interactive components, specify keyboard behavior, focus ownership, dismissal, and callbacks. Include loading, empty, error, disabled, and invalid states only where they apply.

## Review and validation

| Concern       | Evidence to collect when relevant                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition   | A consumer can change content, attach handlers/refs, and compose primitives without copying internals.                                                                                                           |
| Public types  | Supported props compile; invalid combinations are rejected where the API promises this.                                                                                                                          |
| Accessibility | Native semantics, accessible names, labels/errors, keyboard operation, focus restoration, and status announcements work. Check interaction manually or with appropriate tests; automated lint is only one input. |
| Styling       | Semantic tokens work in light/dark themes; focus is visible; long content, small viewports, and zoom do not hide controls or information.                                                                        |
| State         | Controlled and uncontrolled contracts behave consistently; callbacks run as documented; loading/disabled states prevent unintended actions.                                                                      |
| Rendering     | Server rendering and hydration work for supported consumers; browser APIs, IDs, timers, and event subscriptions have appropriate boundaries and cleanup.                                                         |
| Portability   | Required dependencies, aliases, CSS, fonts, providers, and framework assumptions are explicit and verified for the intended consumer.                                                                            |
| Compatibility | Existing consumer behavior is preserved or the breaking change and migration are documented.                                                                                                                     |

## Choose checks by the change

- Documentation changes: verify accuracy, links, and formatting. Do not rebuild the app for prose alone.
- Component API or interaction changes: run lint and typecheck; exercise the affected dashboard feature and important state/keyboard transitions. Add focused behavior or type tests when they protect a meaningful contract. Use existing test tooling; introduce a harness only when warranted by the task.
- Styling changes: inspect affected states at representative viewport sizes and themes. Screenshots can support visual checks but do not prove interaction or accessibility.
- Framework integration, client boundaries, imports, dependencies, or exports: also verify the relevant build and consumer environment. Run dev mode when the risk concerns development behavior.

Available commands from the app directory are `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, and `pnpm build`. Use the pinned pnpm version and frozen lockfile for installation checks. Stop repeating checks once they cover the final changes and pass.

## Ready to share

A shared component needs a clear contract, a realistic usage example, documented dependencies, and evidence for the relevant criteria above. Dashboard features also need appropriate data validation, failure handling, and persistence behavior for their intended use. Report what was verified and any remaining limitation. Current mock authentication, sample data, and browser-only persistence must not be presented as production security or backend functionality.
