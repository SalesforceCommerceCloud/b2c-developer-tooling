# Token System

Your theme lives in `src/theme/`. `src/theme/index.css` is the entry point (it sets Tailwind `@source` scoping and imports `shared.css`). `shared.css` imports, in order: `tw-animate-css`, `tailwind.css`, `tokens/*.css`, `animations.css`, `base.css`, then `overrides/*.css`. `storybook.css` is a second entry used by Storybook with wider `@source` globs.

## How a token becomes a class

1. A CSS variable is defined in a token file: `--primary: #131315;` (in `:root`).
2. `src/theme/tailwind.css` bridges it inside an `@theme inline { ... }` block: `--color-primary: var(--primary);`.
3. Components use the generated utilities: `bg-primary`, `text-primary-foreground`, `border-primary`.

To add a token, do both steps 1 and 2. Then use the class. Never use arbitrary values such as `bg-[#131315]` or `bg-[--primary]`.

## Token files (`src/theme/tokens/`)

| File | Contents |
|---|---|
| `core.css` | Surface and text palette (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--tertiary`, `--muted`, `--accent`), `--destructive`/`--success`/`--warning`/`--info` pairs, borders/input/ring/separator, rating, and the shape tokens `--ui-radius`, `--ui-shadow`, `--ui-border-width`. WCAG contrast ratios are annotated in comments. |
| `status.css` | Warning/active backgrounds, account action colors, `--status-*` (positive, warning, critical, info) |
| `header.css` | Header, header-menu, footer, and newsletter band colors; `--header-logo-filter` |
| `swatch.css` | Product swatch and color-pill sizing/colors |
| `brand.css` | `--brand-*` palette primitives and the hero scrims `--hero-overlay-dark`, `--hero-overlay-light`, `--hero-scrim` |
| `components.css` | Component-scoped tokens (payment brand colors, cart, product badge) |
| `custom.css` | Focus and input-background helpers |
| `sidebar.css`, `agentic.css` | Sidebar palette; agentic-shopping UI palette |

Other theme files: `tailwind.css` (font stacks `--font-sans/-serif/-mono`, color bridge, `border-ui` utility), `base.css` (`@font-face`, base layer, `.section-container`, section-scoped shape rules), `animations.css`, and `overrides/*.css` for component-level CSS (navigation, cart sheet, toasts, store locator).

## Class cheat sheet

| Need | Classes |
|---|---|
| Page surface | `bg-background text-foreground` |
| Card / popover | `bg-card text-card-foreground`, `bg-popover text-popover-foreground` |
| Primary action | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Secondary / muted | `bg-secondary text-secondary-foreground`, `bg-muted text-muted-foreground` |
| Borders | `border-border`, `border-border-subtle`, `border-input`; focus `ring-ring` |
| Destructive / success / warning / info | `bg-destructive text-destructive-foreground`, and the same pairs for `success`, `warning`, `info` |
| Status text | `text-status-positive`, `text-status-critical`, `bg-status-critical-bg`, `bg-warning-bg`, `bg-active-bg` |
| Header | `bg-header-background text-header-foreground border-header-border`, `bg-header-menu-background`, `bg-header-menu-hover-background` |
| Footer / newsletter | `bg-footer-background text-footer-foreground`, `bg-newsletter-background` |
| Brand primitives | `bg-brand-black`, `text-brand-white`, `bg-brand-gray-100` (prefer semantic tokens when one fits) |

Opacity modifiers work on bridged colors (`bg-primary/90`). Focus ring convention from the shipped Button: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`.

`--border` is the darker tier and `--border-subtle` the lighter one; both are set to meet 3:1 contrast against white. If you change them, re-check contrast.

## Hard-coded colors

`custom/color-linter` (OxLint) rejects raw Tailwind palette utilities in `className` and `cn()` string literals. Fix by picking a semantic token or adding a token as above. Use `pnpm lint` to check.

## Dark mode

The shipped theme defines a single palette in `:root`; there is no `.dark` token block. Some shadcn primitives still carry `dark:` utilities inherited from upstream, which are inert unless you add a dark palette yourself.
