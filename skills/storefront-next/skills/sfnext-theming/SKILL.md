---
name: sfnext-theming
description: >-
  Re-brand and re-skin a Storefront Next storefront: change the color palette, corner radius and shadows (shape tokens), header and footer colors, typography and web fonts, logo, favicon, hero scrims, and brand copy, with WCAG contrast checks. Use when asked to rebrand or restyle the storefront, change the primary color, swap the font, make the header dark, make cards rounded or flat, replace the logo, edit src/theme, core.css, header.css, brand.css, tailwind.css, base.css, or src/lib/fonts.ts, or verify a theme change in the Design System Storybook stories. Do not use for building or styling an individual component (use `storefront-next:sfnext-components`), Figma kit sync (use `storefront-next-figma:sfnext-create-figma-kit`), or site configuration (use `storefront-next:sfnext-configuration`).
---

# Theming a Storefront Next Storefront

Your storefront has exactly one theme, in `src/theme/`, and it is yours to edit. Rebranding is mostly value changes in a few CSS files; components pick the new look up through token classes. Choose a starting look with `sfnext create-storefront --vertical <id>` (a starter theme) and then customize it as below.

## Where things live

| Concern | File |
|---|---|
| Entry point and Tailwind `@source` scoping | `src/theme/index.css` (imports `shared.css`, which sets import order) |
| Palette: background, foreground, primary, secondary, accent, muted, border, ring, destructive/success/warning/info | `src/theme/tokens/core.css` |
| Shape: `--ui-radius`, `--ui-shadow`, `--ui-border-width` | `src/theme/tokens/core.css` |
| Header, menu, footer, newsletter band, `--header-logo-filter` | `src/theme/tokens/header.css` |
| Status and feedback colors | `src/theme/tokens/status.css` |
| Swatches, sidebar, agentic UI, payment and cart extras, focus helpers | `tokens/swatch.css`, `sidebar.css`, `agentic.css`, `components.css`, `custom.css` |
| `--brand-*` color primitives and hero scrims (`--hero-overlay-*`, `--hero-scrim`) | `src/theme/tokens/brand.css` |
| Font stacks `--font-sans/-serif/-mono`; token-to-utility bridge | `src/theme/tailwind.css` (`@theme inline`) |
| `@font-face`, base layer, `.section-container`, section-scoped shape rules | `src/theme/base.css` |
| Component-level CSS (navigation, cart sheet, toasts, store locator) | `src/theme/overrides/*.css` |
| Font binding and preload | `public/fonts/*.woff2`, `src/lib/fonts.ts` (used by `src/root.tsx`) |
| Logo, favicon, hero and payment images | `public/images/`, `public/favicon.ico` |
| Site name and brand strings | `src/locales/<locale>/translations.json` (`common.defaultSiteName`) |

Palette values are not all derived from `brand.css`: `core.css` sets `--primary` and friends directly, so change them there. Token-to-class wiring and the full token file list are covered in `storefront-next:sfnext-components` (token system reference).

## Workflow

### 1. Read the current theme

Open `src/theme/index.css`, `tokens/core.css`, `tokens/header.css`, and `tailwind.css` before editing. Keep variable names; change values.

### 2. Palette

Edit `:root` in `tokens/core.css`: `--primary`/`--primary-foreground`, `--background`/`--foreground`, `--secondary`, `--accent`, `--muted`, borders, `--ring`. Comments in the file record WCAG contrast ratios for the current values; recompute for yours. Minimums: 4.5:1 for text (`--primary` on `--primary-foreground`, `--foreground` on `--background`, each status color on its `-foreground`), 3:1 for borders and focus rings against the surface.

Update `tokens/status.css` if semantic colors clash with the new palette, and `tokens/swatch.css`, `tokens/components.css` where defaults look off.

### 3. Header, footer, and newsletter chrome

`tokens/header.css` is deliberately decoupled from `--primary`, so changing the primary color does not recolor the header. Set `--header-background`/`--header-foreground`, menu hover/active colors, and `--footer-*` yourself. The logo is an image: for a dark header with a dark logo, set `--header-logo-filter` (for example `brightness(0) invert(1)` turns a black logo white; `none` leaves it alone). `--newsletter-background` defaults to `var(--primary)`.

### 4. Shape

Set `--ui-radius`, `--ui-shadow`, `--ui-border-width` in `core.css` to re-skin every shadcn primitive at once. Flat and square: `0`, `none`, `0`. Soft and raised: `var(--radius-xl)`, a light shadow, `0`. Do not edit primitives or add `rounded-*`/`shadow-*` classes, and never write `--radius-ui` / `--shadow-ui` (compile-time bridges, silent no-op). Scoped overrides, section rules, and the Card border exception are covered in `storefront-next:sfnext-components` (shape tokens reference). If your default border width is 0, the section rules at the bottom of `base.css` re-enable 1px Card borders on account, auth, and checkout pages; adjust those to taste.

### 5. Typography

Four touch points, all must agree:

1. Put the variable `.woff2` in `public/fonts/`.
2. `src/lib/fonts.ts`: `import font from '/fonts/<file>.woff2'; export const primaryFont = font;` (`root.tsx` preloads it).
3. `@font-face` in `src/theme/base.css` (same URL, weight range, `font-display: swap`).
4. `--font-sans` / `--font-serif` / `--font-mono` in `src/theme/tailwind.css`, with a fallback stack of similar metrics.

Self-host fonts (WOFF2, preloaded, no third-party CDN). Remove the old font file if unused.

### 6. Assets and copy

- Logo: replace `public/images/logo.svg` (the `Logo` component in `src/components/logo` renders it; you can replace that component for an inline-SVG logo).
- Favicon: `public/favicon.ico`.
- Hero and promo images: `public/images/` (and the Page Designer content that references them).
- Brand name: `common.defaultSiteName` in each `src/locales/<locale>/translations.json` you ship (used in page titles).
- Hero text scrims: `--brand-black`/`--brand-white` in `brand.css` feed `--hero-overlay-dark/-light` and `--hero-scrim`; update them with the brand so hero text stays legible.

### 7. Dark mode

The shipped theme has one palette and no `.dark` token block. Do not promise dark mode; it would be new work (a `.dark` scope for every token file).

### 8. Verify

```bash
pnpm dev                                   # look at home, PLP, PDP, cart, checkout, account
pnpm storybook                             # Design System/Theme/Colors, Typography, Radius, Shadows
pnpm lint                                  # color-linter flags hard-coded colors
pnpm typecheck
pnpm storybook:test --type=snapshot        # add --update only after reviewing intended changes
pnpm storybook:test --type=a11y            # contrast and ARIA via axe-core
```

The `Design System/Theme/*` stories (`src/design-system/stories/`) render the live tokens and are the quickest visual check.

## Guardrails

- Change values in token files; do not sprinkle hex codes or `bg-[#...]` in components.
- Need a new token? Define it in a `tokens/*.css` file and bridge it in `@theme inline` in `tailwind.css` (see TOKEN-SYSTEM).
- Component-level CSS goes in `src/theme/overrides/*.css` (import it from `shared.css`) or `base.css`; prefer `[data-slot="..."]` selectors over utility-class selectors.

## Design handoff

If your designers work in Figma, keep the Figma variables and code tokens aligned with `storefront-next-figma:sfnext-create-figma-kit` (requires the Figma MCP server). Change the tokens in code first, then sync the kit.

## Related Skills

- `storefront-next:sfnext-components` - Build and style components with token classes and shape tokens
- `storefront-next:sfnext-accessibility` - Contrast, focus, and accessibility scans
- `storefront-next:sfnext-i18n` - Locale files that hold brand copy
- `storefront-next:sfnext-performance` - Font and image loading guidance
- `storefront-next:sfnext-page-designer` - Content and hero components authored in Page Designer
- `storefront-next-figma:sfnext-create-figma-kit` - Sync the Figma design kit with your tokens
