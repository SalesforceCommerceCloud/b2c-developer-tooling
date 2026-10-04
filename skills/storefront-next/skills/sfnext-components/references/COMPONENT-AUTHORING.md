# Component Authoring

## Workflow

1. **Search first.** `ls src/components`, and grep for the behavior you need. Prefer composing or extending.
2. **Pick the layer.** shadcn fork in `src/components/ui/`, or a composite in `src/components/<name>/`, or an extension under `src/extensions/`.
3. **Implement** with token classes, `cn()`, project link wrappers, i18n, `formatCurrency`.
4. **Add a test** (`index.test.tsx`, Vitest + Testing Library) and a **story** (see [STORYBOOK.md](STORYBOOK.md)).
5. **Verify** with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm storybook:test --type=snapshot`.

## Composite example

A small presentational component with a variant, token classes, a `data-slot` root, translated text, and a safe price format. Names here are illustrative; check that a component of that name does not already exist.

```tsx
/* Apache header (copy from any existing file) */
import { cva, type VariantProps } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

const promoVariants = cva('inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-ui', {
    variants: {
        tone: {
            default: 'bg-primary text-primary-foreground',
            muted: 'bg-muted text-muted-foreground',
            danger: 'bg-destructive text-destructive-foreground',
        },
    },
    defaultVariants: { tone: 'default' },
});

interface PromoPriceProps extends VariantProps<typeof promoVariants> {
    amount: number;
    currency: string;
    locale: string;
    className?: string;
}

export function PromoPrice({ amount, currency, locale, tone, className }: PromoPriceProps) {
    const { t } = useTranslation();
    return (
        <span data-slot="promo-price" className={cn(promoVariants({ tone }), className)}>
            {t('promoPrice.label', { defaultValue: 'Now' })} {formatCurrency(amount, locale, currency)}
        </span>
    );
}
```

Add real translation keys to `src/locales/<locale>/translations.json` for every supported locale (see `storefront-next:sfnext-i18n`); do not rely on `defaultValue` in shipped code.

## Rules of thumb

- **Props over globals.** Keep components presentational; data arrives through props or a narrow hook.
- **`asChild`** (Radix `Slot`) for polymorphism; do not add an `as` prop.
- **`data-slot`** on the root and named regions. It is the stable hook for theme CSS and shape-token overrides. It is a convention of the shadcn forks, not a lint rule.
- **Variants** with `cva`; variant classes use semantic tokens (`text-destructive-foreground`, not `text-white`).
- **Shape**: no raw `rounded-*`/`shadow-*` on primitives or Cards; see [SHAPE-TOKENS.md](SHAPE-TOKENS.md). `rounded-full` on a pill or avatar and `rounded-t-*` style directional radii are fine.
- **Context**: split React contexts by concern; avoid one large `AppContext` (every change re-renders every consumer).
- **Client-only data** goes through loaders or `useFetcher`, not `useEffect` fetches for first render.
- **Links**: `@/components/link`, `@/hooks/use-navigate`.
- **Icons**: `lucide-react` (and `@icons-pack/react-simple-icons` for brand icons).

## Editing a shadcn primitive

Primitives are your fork. It is fine to edit them in place: add a variant, a prop, or a `data-slot`. Keep shape tokens (`rounded-ui`, `shadow-ui`, `border-ui`) and `@/` imports. After editing or syncing, run `node .claude/skills/sync-shadcn/sync.mjs restyle --all --check`. Do not add app-specific components to `src/components/ui/`; wrap the primitive in `src/components/` instead:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PillButton(props: React.ComponentProps<typeof Button>) {
    return <Button {...props} className={cn('rounded-full', props.className)} />;
}
```

## CSS component class, utility, or React component?

Default to a React component when there is markup, props, or logic. Use a CSS component class only for a pure layout bag of properties applied to many different elements, defined in `@layer components` in `src/theme/base.css` so utilities can still override it. The shipped example is `.section-container` (horizontal padding, max width, centered). Do not use `@utility` for overridable multi-property compositions; the utilities layer has the highest specificity and overrides lose.

```css
/* src/theme/base.css */
@layer components {
    .section-container {
        @apply px-4 sm:px-8 lg:px-16 max-w-screen-2xl mx-auto;
    }
}
```

## Decorative icons from CSS

To add a purely decorative icon to a component you do not want to fork, define the SVG once as a token (a percent-encoded `data:image/svg+xml` URI, with `stroke="black"` because only alpha matters in a mask) in `src/theme/tokens/core.css`, then paint it with a pseudo-element in `src/theme/base.css`:

```css
[data-slot="section-title"]::before {
    content: "";
    display: inline-block;
    width: 1rem;
    height: 1rem;
    background-color: currentColor;      /* tracks the text color */
    -webkit-mask: var(--icon-star) center / contain no-repeat;
    mask: var(--icon-star) center / contain no-repeat;
}
```

Use `mask` plus `background-color`, not `content: url()` (which cannot inherit `currentColor`). Keep the hooked structure stable. Full write-up with state swapping: `docs/README-UI-STYLING.md`.

## Accessibility checklist

- Semantic HTML first (`button`, `nav`, `main`, `ul`), ARIA only to fill gaps.
- Interactive elements are keyboard reachable with a visible focus ring (`focus-visible:ring-ring/50 focus-visible:ring-[3px]`).
- Text and UI boundaries meet WCAG AA contrast using theme tokens (the token comments in `core.css` record ratios).
- Images have `alt` (empty string for decorative).
- Run `pnpm lint:a11y` and `pnpm storybook:test --type=a11y`. See `storefront-next:sfnext-accessibility`.

## Page Designer

To make a component editable in Page Designer, use the decorators and registry described in `storefront-next:sfnext-page-designer`; do not hand-roll metadata.
