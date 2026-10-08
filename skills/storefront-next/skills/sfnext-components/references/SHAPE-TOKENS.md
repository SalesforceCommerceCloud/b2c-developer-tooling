# Shape Tokens

Radius, shadow, and Card border width are driven by three variables so one edit re-skins every shadcn primitive. The project doc is `docs/README-SHAPE-TOKENS.md`; this is the working summary.

| Variable | Defined in | Utility |
|---|---|---|
| `--ui-radius` | `src/theme/tokens/core.css` | `rounded-ui` (about 19 primitives) |
| `--ui-shadow` | `src/theme/tokens/core.css` | `shadow-ui` |
| `--ui-border-width` | `src/theme/tokens/core.css` | `border-ui` (Card only) |

Your starter theme's values are the ones in `core.css` (a square, flat, borderless default is `0` / `none` / `0`). For a rounded, raised look set for example `--ui-radius: var(--radius-xl)` and a soft `--ui-shadow`.

## The bridge-variable trap

`src/theme/tailwind.css` contains `--radius-ui: var(--ui-radius)` and `--shadow-ui: var(--ui-shadow)` inside `@theme inline`. Tailwind inlines these at compile time, so `--radius-ui` and `--shadow-ui` do not exist at runtime. Writing them is a silent no-op that passes lint and typecheck. Always write `--ui-radius`, `--ui-shadow`, `--ui-border-width`. `border-ui` is an `@utility` that reads `--ui-border-width` at runtime.

## Overrides

Per instance (Tailwind arbitrary property):

```tsx
<Card className="[--ui-border-width:2px] border-primary">
<Card className="[--ui-radius:var(--radius-2xl)]">
<Card className="[--ui-shadow:none]">
```

Per component or section, in `src/theme/base.css`. Use `[data-slot="card"]` as the hook, and `:where()` to keep specificity low so className overrides still win:

```css
.product-card[data-slot="card"] {
    --ui-radius: var(--radius-2xl);
    --ui-shadow: 0 4px 16px -4px rgb(0 0 0 / 0.12);
}

:where([data-section="auth"]) [data-slot="card"] {
    --ui-border-width: 1px;
}
```

The shipped `base.css` already re-enables a 1px Card border for account, auth, checkout, and order-confirmation sections because the default border width is 0. Place later `:where()` blocks after earlier ones that target the same `data-slot`; equal specificity means the later block wins.

## Don't

| Don't | Why | Do |
|---|---|---|
| `className="rounded-xl"` or `rounded-none` on a primitive | Fights the token; breaks when the token changes | Set `[--ui-radius:...]` or change `core.css` |
| `className="border"` / `border-2` on Card | `border-ui` reads the variable, both classes coexist | `[--ui-border-width:1px]` |
| `!rounded-none`, hard-coded `border-radius` / `box-shadow` in CSS | Not token-driven | Override the variable |
| Styling via Tailwind class selectors (`.bg-cover`) | Breaks on refactor | Target `data-slot` |

`cn()` in `src/lib/utils.ts` registers `border-ui` as its own tailwind-merge group, so `cn('border-ui border-border', 'border-primary')` keeps width and swaps color.
