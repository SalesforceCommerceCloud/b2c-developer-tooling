# Token System Reference

## The one rule that overrides everything else

**Never use a raw hex value, RGB value, or hardcoded color in any component or CSS file.**
Always use a semantic Tailwind utility that maps to a CSS variable. The variables are defined in
`src/theme/tokens/` and bridged to Tailwind utilities in `src/theme/tailwind.css`.

```tsx
// ✅ correct
<div className="bg-primary text-primary-foreground" />

// ❌ wrong — breaks dark mode, breaks vertical theming, breaks Figma sync
<div style={{ background: '#000000', color: '#ffffff' }} />
<div className="bg-black text-white" />
```

## Token files and what they own

| File | Owns |
|------|------|
| `src/theme/tokens/core.css` | Background, foreground, card, popover, primary, secondary, muted, accent, border, input, ring, separator, rating, charts, sidebar, focus helpers |
| `src/theme/tokens/brand.css` | Brand palette (`--brand-black`, `--brand-white`, `--brand-gray-*`, `--brand-primary`). **This is the only file that changes per vertical.** |
| `src/theme/tokens/header.css` | Header background/foreground, header menu surfaces, footer. Dark header = black bg / white text. |
| `src/theme/tokens/status.css` | Destructive, warning, success, info, status-positive/warning/critical, active-bg |
| `src/theme/tokens/swatch.css` | Swatch color, labeled, pill — variant selector UI only |
| `src/theme/tokens/components.css` | Payment provider colors, cart-specific tokens |

## Semantic token meanings — use the right one

### Text colors
| Token class | When to use |
|-------------|-------------|
| `text-foreground` | Default body text, headings |
| `text-muted-foreground` | Secondary labels, helper text, placeholder, metadata |
| `text-primary-foreground` | Text on a `bg-primary` surface (e.g. button label) |
| `text-secondary-foreground` | Text on a `bg-secondary` surface |
| `text-accent-foreground` | Text on a `bg-accent` surface (hover chips, tags) |
| `text-destructive` | Error text, destructive action labels |
| `text-card-foreground` | Text inside card surfaces |

### Background colors
| Token class | When to use |
|-------------|-------------|
| `bg-background` | Page/app background |
| `bg-primary` | CTAs, filled buttons, strong actions |
| `bg-secondary` | Secondary button fill, subtle section bg |
| `bg-muted` | Skeleton, disabled surfaces, subtle fills |
| `bg-accent` | Hover state, selected chip, tag bg |
| `bg-card` | Card and tile surfaces |
| `bg-popover` | Dropdown, tooltip, modal backgrounds |

### Borders
| Token class | When to use |
|-------------|-------------|
| `border-border` | Standard dividers, list separators — uses alpha so it renders correctly on ANY surface color |
| `border-border-subtle` | Form inputs, card edges — slightly more visible |
| `border-input` | Input field border specifically |
| `ring-ring` | Focus ring on interactive elements |

**Never use `border-black`, `border-gray-*`, or `divide-gray-*`.** Use `border-border` or `border-border-subtle`.

### Header/navigation surfaces
| Token class | When to use |
|-------------|-------------|
| `bg-[--header-background]` | Header band background |
| `text-[--header-foreground]` | Header text and icons |
| `bg-[--header-menu-background]` | Mega/dropdown menu panel |
| `bg-[--footer-background]` | Footer background |

### Status and feedback
| Token class | When to use |
|-------------|-------------|
| `text-destructive` / `bg-destructive` | Delete, remove, error state |
| `bg-warning-bg` / `text-warning-foreground` | Caution messages |
| `text-status-positive` | In-stock, success indicator |
| `text-status-critical` | Out of stock, error badge |
| `bg-active-bg` / `text-active-foreground` | Active/authorized badge |

## Dark mode rules

**Do not write `dark:bg-black` or any dark: hardcoded color.**
Dark mode is fully handled by `.dark` overrides in `src/theme/tokens/core.css` and other token files.
Using semantic classes automatically gets the correct dark value.

```tsx
// ✅ correct — dark mode is automatic
<div className="bg-card text-card-foreground" />

// ❌ wrong
<div className="bg-white dark:bg-gray-900 text-black dark:text-white" />
```

The only valid `dark:` usage is for classes that reference another semantic token:

```tsx
// ✅ valid dark: override pattern
className="dark:bg-input/30 dark:border-input"
```

## What changes per vertical — and what does not

### Changes (vertical-specific, lives in `src/theme/tokens/brand.css`)
- Brand palette values (`--brand-black`, `--brand-primary`, `--brand-gray-*`)
- Logo treatment (`--header-logo-filter`)
- Brand-specific component tokens

### Does NOT change (shared, lives in core/header/status/swatch/components)
- Semantic token names and their Tailwind utility names
- Dark mode pairing rules
- Component variant logic (CVA)
- Border alpha values
- Status and feedback colors

**Never override core.css, header.css, status.css, swatch.css, or components.css to create a vertical.**
Only `brand.css` changes between verticals.

## Tailwind utility bridge

All token → Tailwind utility mappings are defined in `src/theme/tailwind.css`.
If a CSS variable exists in a token file but has no Tailwind utility in `tailwind.css`, add it there
before using it in a component. Do not use arbitrary `[--variable-name]` syntax for variables that
should be in the bridge.

```css
/* src/theme/tailwind.css — add new token bridge entries here */
--color-my-new-token: var(--my-new-token);
```

Then use `bg-my-new-token` in components.
