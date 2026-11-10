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

## Form controls

`Checkbox` wraps the installed Radix checkbox with the same semantic theme tokens
as other controls. Use controlled `checked`/`onCheckedChange` or uncontrolled
`defaultChecked`. The value can be `true`, `false` or `"indeterminate"`; binary
consumers should use `checked === true` in their callback. It supports Space to
toggle, checked/mixed/disabled/invalid states and native form participation through
`name`, `value`, `required` and `form`. Label it with a wrapping label, `htmlFor`
and `id`, or `aria-label`. The ref targets the button; native root props, styling
and test IDs are forwarded. Children and `asChild` are excluded: the component
owns its check/mixed indicator, and the consumer supplies a separate label.

```tsx
<label htmlFor="estimate" className="flex min-h-11 items-center gap-2">
  <Checkbox
    id="estimate"
    checked={estimated}
    onCheckedChange={(checked) => setEstimated(checked === true)}
  />
  This amount is an estimate
</label>
```

The control uses React, `radix-ui`, `lucide-react`, `cn` and the app's
Tailwind/semantic theme styles. It has no route, authentication or finance logic.

`Select` composes the installed Radix Select primitive. It supports controlled
`value`/`onValueChange` or uncontrolled `defaultValue`, keyboard navigation,
type-ahead, disabled options, focus restoration, and native form participation
through `name` and `required`. Label the trigger using its `id` or `aria-label`.
Native trigger props, refs and test IDs are forwarded. Content renders in a portal.

Component function props are annotated with `Readonly<Props>` (including native
prop intersections). This protects the prop bindings without freezing objects or
changing the caller's values at runtime.

```tsx
<label htmlFor="account-type">Account type</label>
<Select name="accountType" defaultValue="chequing" required>
  <SelectTrigger id="account-type"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="chequing">Chequing</SelectItem>
    <SelectItem value="savings">Savings</SelectItem>
  </SelectContent>
</Select>
```

`MonthPicker` is a controlled month/year field. Supply a `YYYY-MM` string and
`onValueChange`; an empty or invalid value displays the placeholder. Optional
`name` adds a hidden field for `FormData`. Validate required/allowed values in
the consumer: hidden inputs do not provide native constraint validation.
`disabled`, refs, native button props and test IDs apply to the trigger;
`className` styles it and `contentClassName` styles its popup.

```tsx
<label htmlFor="start-month">Start month</label>
<MonthPicker id="start-month" name="startMonth"
  value={month} onValueChange={setMonth} />
```

The popup focuses the selected month. Arrow keys move within the visible year;
Home/End move to its first/last month. Separate buttons change the year.
Enter/Space selects; Escape dismisses and restores trigger focus. Supported
years are 1–9999. `locale` formats month names and defaults to `en-CA` for stable
server/client output; navigation labels currently use English. It selects months,
not individual dates. Controlled values must be reset by the consumer.

Both controls require React, the existing `radix-ui` and `lucide-react` packages,
`cn`, and the app's Tailwind/semantic theme styles. MonthPicker additionally
composes `Button` and `Popover`. Neither control depends on routes, authentication,
Convex, or feature data. Porting them requires adapting local import aliases.
