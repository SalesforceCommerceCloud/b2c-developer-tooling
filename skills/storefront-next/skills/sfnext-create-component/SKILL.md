---
name: sfnext-create-component
description: Author a new Storefront Next design-system component the right way — pick the correct layer (primitive vs composite), reuse-or-extend before creating, define CVA variants bound to semantic tokens, add data-slot attributes, satisfy the accessibility checklist, and ship a Storybook story. Use when asked to create, add, or build a new UI component, button/badge/tile/card variant, or design-system primitive. This is the design-system authoring discipline; for createPage/Suspense/shadcn page-rendering patterns see sfnext-components.
persona: developer
category: Headless Storefront (Storefront Next)
tags: [headless, storefront-next, storefront, design-system, scaffolding, testing]
---

# Create a Component Skill

This skill is the authoring discipline for adding a new component to a Storefront Next storefront: choosing the right layer, reusing before creating, and meeting the token / a11y / Storybook requirements that keep the design system consistent.

> **It complements `sfnext-components`.** That skill covers engineering patterns — `createPage`, Suspense/`Await` streaming, shadcn/ui setup, the `cn()` utility. **This** skill covers design-system authoring — the layer model, the extend-before-create gate, CVA variants bound to semantic tokens, `data-slot`, accessibility, and story coverage. Use both together when building UI.

## Before you start — scan first (extend before create)

Do not create a new component file until you have run this scan:

1. Search `src/components/` for components with a similar name or behaviour.
2. Search `src/components/ui/` for Shadcn primitives — run `npx shadcn@latest add <name>` to check whether it exists before hand-rolling one.
3. Apply the REUSE / EXTEND / CREATE decision:
   - **REUSE** — an existing component already does this → use it as-is.
   - **EXTEND** — an existing component is close → add a new CVA variant (cheaper than a new file).
   - **CREATE** — nothing exists → proceed with this skill.

See [Component Authoring Reference](references/COMPONENT-AUTHORING.md) for the full layer model and the extend-before-create rule.

## Step 1 — Decide the layer

| Question | Layer | Location |
|----------|-------|----------|
| Pure UI element, no data or business logic? | **Primitive** | `src/components/ui/` (check shadcn first) |
| Assembles primitives or takes data props? | **Composite** | `src/components/` |

For primitives, always check shadcn before hand-rolling:

```bash
# from packages/template-retail-rsc-app
npx shadcn@latest add <component-name>
```

Shadcn components land in `src/components/ui/` already wired to the token system. If it exists in shadcn, use it — do not hand-roll a replacement.

## Step 2 — Create the file with the copyright header

```
src/components/<feature>/<component-name>.tsx    ← preferred (feature-grouped)
src/components/<component-name>.tsx              ← acceptable for standalone components
```

Start every `.ts`/`.tsx` file with the Apache 2.0 copyright header (ESLint enforces it), then imports:

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
// Import primitives from src/components/ui/ — not from @radix-ui directly
import { Button } from '@/components/ui/button'
```

## Step 3 — Type the props explicitly

```tsx
interface ProductTileProps {
  productId: string
  name: string
  price: number
  imageUrl: string
  currency?: string
  className?: string
}
```

No `any`. Extend `React.ComponentProps<'element'>` for native passthrough. Use discriminated unions for mutually exclusive prop shapes.

## Step 4 — Define CVA variants (if the component has visual states)

```tsx
const productTileVariants = cva(
  'relative flex flex-col overflow-hidden rounded-md bg-card text-card-foreground',
  {
    variants: {
      density: {
        comfortable: 'gap-4 p-4',
        compact: 'gap-2 p-2',
      },
    },
    defaultVariants: { density: 'comfortable' },
  }
)
```

**Token rules:** every class that affects color MUST use a semantic token utility (`bg-primary`, `text-foreground`, `border-border`, …). No raw hex, no `bg-black`, no `text-gray-500`. See [Token System Reference](references/TOKEN-SYSTEM.md).

## Step 5 — Write the component

```tsx
export function ProductTile({
  productId,
  name,
  price,
  imageUrl,
  currency = 'USD',
  className,
  density,
  ...props
}: ProductTileProps & VariantProps<typeof productTileVariants>) {
  return (
    <article
      data-slot="product-tile"
      data-product-id={productId}
      className={cn(productTileVariants({ density }), className)}
      {...props}
    >
      <div data-slot="product-tile-image">{/* image */}</div>
      <div data-slot="product-tile-body" className="flex flex-col gap-1">
        <span data-slot="product-tile-name" className="text-sm font-medium text-foreground">
          {name}
        </span>
        <span data-slot="product-tile-price" className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)}
        </span>
      </div>
    </article>
  )
}
```

Required on every component:
- `data-slot` on the root and each named region.
- `className` accepted and merged via `cn()` **last** so callers can override.
- Native props spread via `{...props}`.

## Step 6 — Create the Storybook story

Every new component in `src/components/` needs a `.stories.tsx` — one story per CVA variant plus a `Snapshot` story for CI diffing.

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ProductTile } from './product-tile'

const meta: Meta<typeof ProductTile> = {
  title: 'Components/Product/ProductTile',
  component: ProductTile,
}
export default meta

type Story = StoryObj<typeof ProductTile>

const defaultProps = { productId: 'P001', name: 'Classic Shirt', price: 89.99, imageUrl: '/placeholder.jpg' }

export const Default: Story = { args: defaultProps }
export const Compact: Story = { args: { ...defaultProps, density: 'compact' } }

export const Snapshot: Story = {
  name: 'Snapshot',
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <ProductTile {...defaultProps} density="comfortable" />
      <ProductTile {...defaultProps} density="compact" />
    </div>
  ),
}
```

## Step 7 — Accessibility check

- [ ] Interactive elements are `<button>` or `<a>`, never `<div onClick>`.
- [ ] All form inputs have `<Label htmlFor>`.
- [ ] Focus ring: `focus-visible:ring-ring focus-visible:ring-[3px]`.
- [ ] No color-only information (pair with icon or text).
- [ ] `aria-label` on icon-only buttons.

## Verification

Before marking the task complete, run from the monorepo root:

```bash
pnpm typecheck
pnpm lint
pnpm test-storybook:snapshot:agent
```

All three must pass with zero errors and zero warnings. Lint runs with `--max-warnings 0`.

## Related Skills

- `storefront-next:sfnext-components` - createPage HOC, Suspense/Await, shadcn/ui, Tailwind page-rendering patterns
- `storefront-next:sfnext-testing` - Vitest unit tests and Storybook interaction/a11y tests
- `storefront-next:sfnext-create-vertical` - Brand theming via the token layer
- `storefront-next:sfnext-extensions` - Injecting a component into a page via UITarget

## Reference Documentation

- [Component Authoring Reference](references/COMPONENT-AUTHORING.md) - Layer model, CVA, data-slot, extend-before-create
- [Token System Reference](references/TOKEN-SYSTEM.md) - Semantic token classes and dark mode rules
- [Project Structure Reference](references/PROJECT-STRUCTURE.md) - Where components live in the monorepo
- [Troubleshooting Reference](references/TROUBLESHOOTING.md) - Token, lint, and snapshot pitfalls
