# Component authoring standards

## Vertical extensions — existing components always have priority

When building a vertical extension (`src/extensions/<vertical>/`), check what the **base template already renders** before creating anything new.

**The rule**: if a base component already renders equivalent content at the same location, do NOT create an extension component that duplicates it. Extensions add what is missing — they never recreate what already exists.

### Decision gate (run this before creating any extension component)

1. **Find the base component** — read the relevant route and trace what components it renders.
2. **Check every rendered section** — does the base already render this content (description, accordion, badge, banner, etc.)?
3. **If yes** — use a UITarget slot on the existing content, or customise it via token/variant. Do not create a parallel extension component that renders the same thing.
4. **If no** — the extension is justified. Register it at the correct UITarget.

### Concrete examples

```
❌ WRONG — base ProductView already renders a description accordion ("Overview").
           ProductDetailsExtension adds its own "Overview" section → duplicate.

✅ CORRECT — base already renders description + adapter sections (Specifications, Care Instructions…).
             ProductDetailsExtension only adds the two sections the base does NOT have:
             Shipping & Returns, Warranty Info.
```

```
❌ WRONG — base renders product title in ProductInfo.
           The vertical extension renders product title again in a brand stamp.

✅ CORRECT — brand stamp adds ONLY the brand line ("<BRAND> · <tagline>")
             above the existing ProductInfo, not the title.
```

**Do not create duplicates unless the user explicitly asks for them.**
The cost of a duplicate is paid on every page load, in every test, in every Figma sync. The correct
approach is almost always a UITarget slot or a CSS token override.

---

## Extend before create — mandatory check before any new component

Before writing a single line of a new component, answer these questions in order:

1. **Does an existing component already do this?** Search `src/components/` and `src/components/ui/` by name and by behaviour.
2. **Can an existing component cover this with a new CVA variant?** A new `variant` or `size` value is always cheaper than a new file.
3. **Can composition cover this?** Wrap an existing component in a thin composite rather than duplicating it.
4. **Only if all three answers are no** — create a new component.

```tsx
// ❌ WRONG — creating BrandPrimaryButton when Button already exists
export function BrandPrimaryButton({ children }: Props) {
  return <button className="bg-[#1e6f3a] text-white ...">{children}</button>
}

// ✅ CORRECT — new CVA variant on the existing Button primitive
// In src/components/ui/button.tsx, add to buttonVariants:
brand: 'bg-primary text-primary-foreground hover:bg-primary/90',

// ✅ CORRECT — thin composite when behaviour differs
export function AddToCartButton(props: AddToCartButtonProps) {
  return <Button variant="default" {...props}>Add to Cart</Button>
}
```

---

## Multi-vertical extension governance

When a vertical needs to extend a component, choose the right maintenance model upfront:

```
Does the change only affect visual tokens (color, font, spacing)?
  └─ YES → CVA variant on the existing component. Token system handles most of this via brand.css.
  └─ NO  → Is this structural change needed by only one vertical?
              └─ YES → src/extensions/<vertical-name>/ via UITarget injection. Never touch core.
              └─ NO  → Will another vertical need the same structural pattern?
                          └─ YES → Add a slot/renderProp to the BASE component.
                                   Each vertical provides its own implementation of that slot.
                          └─ UNSURE → Build vertical-specific first (extensions/).
                                      Promote to base when a second vertical needs the same pattern.
```

**Never add vertical-specific logic (if brandA / if brandB) to a shared component.** If you find yourself writing that, the slot/render-prop pattern is missing from the base component.

---

## Layer model — know which layer you are in before writing a line

| Layer | Where | What lives here |
|-------|-------|----------------|
| **Primitive** | `src/components/ui/` | Shadcn-sourced, Radix-backed primitives. Pure rendering, no business logic, no SCAPI. |
| **Composite** | `src/components/` | Assembled from primitives. May accept loaders/data props. No direct SCAPI calls. |
| **Page / Route** | `src/routes/` | Loader, action, error boundary, page layout. Fetches data, passes to composites. |
| **Extension** | `src/extensions/<name>/` | Opt-in additions via UITarget. Self-contained. Never modify core from inside an extension. |

Do not skip layers. A page component should not build raw `<button>` elements. A primitive should not call `useFetcher`.

---

## Primitives (`src/components/ui/`)

These files come from Shadcn and must be treated as infrastructure, not business components.

**When extending a primitive:**
- Do not edit the primitive file directly (it may be refreshed from Shadcn upstream).
- Create a wrapper component in `src/components/` instead.
- Re-export from the wrapper so imports stay consistent.

**Allowed changes to primitive files:**
- Adding a new CVA variant that maps to an existing semantic token — that's it.

---

## CVA — class-variance-authority

All styled components with more than one visual state use CVA.

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-white',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)
```

Rules:
- Every variant value must use semantic token classes only. No raw hex.
- `cn()` from `@/lib/utils` is always the last call — enables external className overrides.
- Export the `*Variants` function alongside the component so it can be reused in related components.

---

## data-slot attributes

Every presentational element in a component tree must carry a `data-slot` attribute for testing and Figma tracing.

```tsx
// ✅
<div data-slot="product-tile">
  <div data-slot="product-tile-image">…</div>
  <div data-slot="product-tile-body">…</div>
</div>
```

The slot name should be kebab-case and match the component name.

---

## TypeScript requirements

- All props are explicitly typed. No `any`.
- Use `React.ComponentProps<'element'>` to extend native element props.
- Discriminated unions for components with mutually exclusive prop shapes.
- `asChild` pattern (via Radix `Slot`) for polymorphic rendering — never accept an `as` prop.

---

## Copyright header

Every `.ts` / `.tsx` file must begin with the Apache 2.0 header. ESLint enforces this.

---

## Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Component files | kebab-case | `product-tile.tsx` |
| Component exports | PascalCase | `ProductTile` |
| Variant objects (CVA) | camelCase + "Variants" suffix | `productTileVariants` |
| data-slot values | kebab-case matching component | `product-tile` |
| Hook files | kebab-case prefixed with "use-" | `use-cart.ts` |

---

## Storybook requirement

Every new component in `src/components/` must have a `.stories.tsx` file.
- One story per CVA variant.
- Default export: `{ title: 'Components/ComponentName', component: ComponentName }`.
- Include a snapshot story (`name: 'Snapshot'`) so CI can diff it.

---

## Accessibility checklist

Before marking a component complete, verify:

- [ ] Interactive elements are native `<button>` or `<a>`, not `<div onClick>`.
- [ ] All inputs have an associated `<Label>` using `htmlFor` (or Radix `Label` with `asChild`).
- [ ] Focus ring uses `focus-visible:ring-ring focus-visible:ring-[3px]` — matches the button primitive.
- [ ] Color information is not communicated by color alone (pair with icon or text).
- [ ] Motion: wrap animations in `prefers-reduced-motion` if not handled by Tailwind's `motion-safe:` prefix.
