# Accessibility checklists

## Classify a finding

| Question | If yes |
|----------|--------|
| Is there a DOM fact a scanner or assertion can check (missing name, unlabeled input, empty live region, `aria-hidden` on focusable, duplicate id, empty heading, contrast)? | Automatable. Reproduce with axe (story a11y run or e2e scan) and fix. |
| Is it about focus landing in the right place, roving arrow keys, trap/return, live region populated? | Has a DOM correlate. Assert it in a story `play()`. |
| Is it reading order, meaning conveyed by color alone, zoom/reflow at 200% to 400%, or exactly what VoiceOver/NVDA speaks? | Manual. Test with the keyboard, browser zoom and a screen reader; record the result. Do not close it as "cannot reproduce" because a scanner is clean. |

For "status message is not announced": if a live region should exist in the DOM, it is assertable; if the claim is purely about speech output, test with assistive technology.

## States to exercise

Scan or assert in each relevant state, not only the settled default:

- default
- form-error (submit empty or invalid)
- modal, drawer or menu open
- out-of-stock / unavailable variant
- after an action (focus after add-to-cart, after closing a dialog)
- zoomed to 400% / narrow viewport
- mobile and desktop viewports
- reduced motion enabled

Prefer states that do not depend on live catalog data for repeatable checks; data-dependent states (out-of-stock, specific content) can differ between local and CI backends.

## Keyboard pass (per page or component)

- Tab order follows the visual order; nothing focusable is hidden; a visible focus indicator is always present.
- All controls operable with Enter/Space; menus, tabs, carousels and swatch groups support arrow keys as expected.
- `Escape` closes dialogs and popovers; focus returns to the trigger.
- No keyboard trap outside intentional modal containment.
- The skip link is the first Tab stop and moves focus to `#main-content`.

## Forms

- Each field has a visible label associated through `FormLabel` or `htmlFor`.
- Error text is associated (`aria-describedby`) and the field is `aria-invalid`; on a failed submit, move focus to the first invalid field or an error summary (verify the behavior of the form you are editing).
- Required state is conveyed in text, not color alone.
- Autocomplete attributes are set for address, email and payment fields.

## Images and media

- Product and content images use `ProductImage`/`DynamicImage` with meaningful alt text; decorative images use empty alt.
- Icon-only buttons have translated accessible names.
- Carousels: labelled region, pause/controls reachable by keyboard, reduced motion respected.

## Content and structure

- One `h1` per page; headings in order.
- Landmarks (`header`, `nav`, `main`, `footer`) present once each with labels where repeated.
- Link text makes sense out of context, in every locale.
- Lists use list markup; keep `role="list"` on styled `ul` (Safari + VoiceOver).

## Where to run what

| Goal | Command |
|------|---------|
| Lint-level a11y only | `pnpm lint:a11y` |
| Rendered component violations | `pnpm storybook:test --type=a11y` |
| Focus/aria behavior | `pnpm storybook:test --type=interaction` |
| Full-page scan vs baseline | `pnpm a11y` |
| Report with HTML snippets for tickets | `pnpm --dir e2e a11y:report` |
