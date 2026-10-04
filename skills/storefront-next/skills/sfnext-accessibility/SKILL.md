---
name: sfnext-accessibility
description: >-
  Build and fix accessible UI in a Storefront Next storefront (WCAG 2.1 AA): jsx-a11y lint findings, missing accessible names and labels, form error association, dialog focus management, aria-live status messages, keyboard behavior, color contrast, and verifying fixes with Storybook a11y/play() tests and the e2e axe scan with its baseline. Use for "accessibility", "a11y", "WCAG", "screen reader", "aria-label", "focus trap", "axe violation", pnpm lint:a11y, pnpm a11y, a11y-baseline.json, skip-a11y, STORYBOOK_A11Y_TEST_MODE, or an accessibility audit finding to fix. Do not use for general lint/typecheck gates (use `storefront-next:sfnext-quality-gates`), writing non-accessibility tests (use `storefront-next:sfnext-testing`), or color/token design (use `storefront-next:sfnext-theming`).
---

# Storefront Next Accessibility

Target: WCAG 2.1 AA. Accessibility is checked at three levels, cheapest first:

| Level | Tool | Catches |
|-------|------|---------|
| Lint | OxLint `jsx-a11y` (`pnpm lint`, `pnpm lint:a11y`) | Missing alt/labels, invalid ARIA, non-interactive handlers, ambiguous link text |
| Component | Storybook a11y addon (axe) and `play()` assertions | Contrast and name/role issues in a rendered state; focus, live regions, dialog behavior |
| Page | e2e axe scan (`pnpm a11y`) against `e2e/a11y-baseline.json` | Page composition, layout, mobile vs desktop |

Some things no scanner finds: focus order, meaning carried by color alone, 200%/400% zoom reflow, and what a screen reader actually announces. Those need keyboard testing, a story `play()` assertion of the DOM facts behind them, or a human with assistive technology.

## Author accessibly by default

1. Use the project's building blocks; they are already accessible in the general case:
   - Radix-based primitives in `src/components/ui/` (dialog, dropdown-menu, sheet, tooltip, ...).
   - `FormLabel`/`FormControl`/`FormMessage` from `@/components/ui/form` and the wrappers in `src/components/form-fields/` (they wire `aria-describedby` and invalid state from form context).
   - `src/components/product-image` and `src/components/dynamic-image` (alt text), `src/components/radio-card` (grouped options), `src/components/skip-link.tsx` (first focusable element, targets `#main-content`), `src/components/announcement-banner`.
2. Icon-only controls need a translated accessible name: `<Button aria-label={t('close')}>`. Decorative icons get `aria-hidden="true"` and must not be focusable.
3. Every input needs a real label; errors must be programmatically associated and announced (form-field wrappers do this).
4. Use semantic elements first (`button`, `a`, `ul`, `h1..h6`); add ARIA only to fill gaps. Keep one `h1` per page and do not skip levels.
5. Status changes that happen without navigation (cart updates, promo applied, errors) need an `aria-live` region (`role="status"` or `role="alert"`); the message must be rendered into an existing live region or the region must exist before content changes.
6. Dialogs and drawers: focus moves in on open, is trapped, returns to the trigger on close, `Escape` closes. Use the Radix dialog primitives rather than hand-rolling.
7. Respect `prefers-reduced-motion` (see `src/components/fade-through-image` and `product-zoom-modal` for the pattern).
8. Keep visible focus styles; do not remove outlines without a replacement from the theme tokens.
9. Do not "fix" `role="list"` on a `ul`: it is deliberate (Tailwind's `list-style: none` removes list semantics in Safari + VoiceOver), and the lint config allows it.

## Fix the right layer

Before editing a shared primitive, check the call site.

- Call-site fix (most common): the primitive is correct but the caller passed no `aria-label`, a meaningless `alt`, or bypassed `FormLabel`. Fix the caller.
- Primitive fix: the shared component itself emits inaccessible markup. One change cascades to every usage, so keep it small and re-run the component's stories and snapshots.
- Many findings citing one primitive usually means one call-site pattern to correct, not a broken primitive.

## Reproduce, fix, confirm

Do not call something fixed from reading code. Capture a failing signal first, then the same check passing afterwards.

1. Name the state: default, form-error, modal-open, out-of-stock, focus-after-action, zoomed. Many violations only exist after interaction, which is why default-page scans come back clean.
2. Reproduce:
   - Lint rule: `pnpm lint:a11y`.
   - Rendered axe rule: run the story with `STORYBOOK_A11Y_TEST_MODE=error` via `pnpm storybook:test --type=a11y`, or add the scenario to the e2e a11y specs.
   - Focus/label/live-region issues: write a `play()` assertion (next section) and watch it fail.
3. Fix at the right layer.
4. Re-run the same check; also run the component's snapshot (`pnpm storybook:test --type=snapshot`, `--update` only after reviewing the diff) and `pnpm lint`.
5. Never add a suppression (disabled axe rule, `oxlint-disable`, `aria-hidden`) just to turn a check green. A suppression is acceptable only when it targets a node you do not control and the reason is written next to it.

## Storybook: a11y addon and play() assertions

- Default addon mode is `todo` (violations are shown, not failing). `pnpm storybook:test --type=a11y` runs in error mode, so violations fail. `STORYBOOK_DISABLE_A11Y=true` turns it off.
- Opt one story file into strict mode: spread `{ a11y: { test: 'error' } }` into `parameters` (see `src/components/checkout/storybook/checkout-strict-a11y-parameters.ts`).
- Tag `skip-a11y` excludes a story from a11y runs. Use it rarely and comment why.
- Assert accessible outcomes, not CSS classes:

```tsx
play: async ({ canvasElement }) => {
    await waitForStorybookReady(canvasElement);
    const body = within(canvasElement.ownerDocument.body); // Radix portals render into <body>
    const dialog = body.getByRole('dialog');
    await expect(dialog).toBeInTheDocument();
    await expect(body.getAllByRole('textbox')[0]).toHaveFocus();
    await expect(body.getByRole('textbox', { name: /email/i })).toBeInTheDocument(); // label association
    await expect(body.getByRole('status')).toHaveTextContent(/saved/i);               // live region populated
},
```

A working reference is `src/components/login/stories/otp-modal.stories.tsx`. Imports: `expect, within, userEvent` from `storybook/test`; `waitForStorybookReady` from `@storybook/test-utils`. Tag the story `interaction` so it runs under `--type=interaction`.

## e2e axe scan and baseline

`pnpm a11y` runs axe (WCAG 2.1 A/AA tags) over key pages at desktop and mobile viewports and compares with `e2e/a11y-baseline.json`. CI fails when critical or serious violations increase or a new critical/serious rule appears; moderate and minor regressions are logged but do not block.

```bash
pnpm a11y                   # scan and compare with baseline
pnpm --dir e2e a11y:report  # or from e2e/: markdown + HTML report of violations
pnpm --dir e2e a11y:update-baseline   # after fixing: ratchet the baseline down, review the diff, commit
pnpm a11y:scan-coverage     # checks that every page route is scanned or explicitly allowlisted
```

- Never hand-edit the baseline; regenerate it.
- New pages: add a `Scenario` in `e2e/src/specs/core/a11y/` (public, account or orders spec), then run `a11y:update-baseline`. Details: `e2e/docs/a11y.md`.
- The dev server must be running (`pnpm dev`) or use `--mode=local` as described in `storefront-next:sfnext-testing`.

## Translated text

`jsx-a11y/anchor-ambiguous-text` only sees literal JSX text. A link whose text comes from `t('...')` is never checked, so review link and label copy in `src/locales/*/translations.json` for "click here"/"read more" style text, in every locale you ship. See `storefront-next:sfnext-i18n`.

More checklists (states, keyboard, pages to spot check): [references/checklist.md](references/checklist.md).

## Related Skills

- `storefront-next:sfnext-quality-gates` - lint config and pre-PR checklist
- `storefront-next:sfnext-testing` - story, unit and e2e test mechanics
- `storefront-next:sfnext-components` - component and form-field conventions
- `storefront-next:sfnext-theming` - color tokens and contrast
- `storefront-next:sfnext-i18n` - translated labels and link text
