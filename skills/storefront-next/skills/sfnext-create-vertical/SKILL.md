---
name: sfnext-create-vertical
description: Create a new Storefront Next vertical (brand theme / storefront variant) by editing brand design tokens, typography, dark mode, and the Figma kit. Use when asked to create a new vertical, brand, theme, or storefront variant, re-skin the storefront, or change the brand palette. Covers the brand.css token layer, semantic token rules, fixture-based local development, and the extension-vs-base decision. NOT for engineering component patterns — see sfnext-components.
---

# Create a Vertical Skill

This skill is the entrypoint for creating a new Storefront Next **vertical** — a brand theme or storefront variant (e.g. Beauty, Furniture, Grocery) layered on top of the shared template without forking shared code.

A vertical is built almost entirely from **design tokens**. The golden rule of the token system makes the whole approach possible:

> **Never use a raw hex value, RGB value, or hardcoded color in any component or CSS file.** Always use a semantic Tailwind utility that maps to a CSS variable.

See [Token System Reference](references/TOKEN-SYSTEM.md) for the full token map and semantic class meanings.

## What a vertical is — and is not

| A vertical **is** | A vertical **is not** |
|-------------------|-----------------------|
| Token value changes in `src/theme/tokens/brand.css` | Forking `src/components/ui/` primitives |
| Optional vertical composition in `src/components/` and `src/extensions/<vertical>/` | Editing `core.css`, `header.css`, `status.css`, `swatch.css`, or `components.css` |
| Optional typography and i18n content | Adding `if (vertical)` branches to shared components |

**Only `src/theme/tokens/brand.css` changes between verticals.** Everything else is shared infrastructure.

## Before you start — read the token layer first

1. Read `src/theme/tokens/brand.css` — understand the current palette structure before defining new values.
2. Read `src/theme/tokens/core.css` — understand how brand values map to semantic roles.
3. Read `src/theme/tailwind.css` — understand the CSS variable → Tailwind utility bridge.

Do not define any new token values until you have read these three files.

## Workflow

### 1. Establish the brand palette

Capture from the brand:

- Brand name
- Light/dark foreground + background pairs
- Signature accent / primary color
- Header surface treatment (dark vs light header)
- Logo treatment and typography

Update **only** values in `src/theme/tokens/brand.css` — do not rename variables.

**WCAG contrast check.** After defining the palette, verify AA contrast (4.5:1 for normal text):

- Primary button: `bg-primary` / `text-primary-foreground`
- Body text: `text-foreground` on `bg-background`

Use the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) or equivalent.

### 2. Add optional typography overrides

If the vertical uses custom fonts:

- Add font loading/import in the app entry.
- Update `--font-sans` / `--font-serif` values in `brand.css`.

### 3. Keep local development stable with fixtures

Vertical work usually happens before real SCAPI credentials are wired up. Use static fixtures so home and PDP render reliably:

- Create `src/config/<vertical>-fixtures.ts` with `VERTICAL_NAV_CATEGORIES` and `VERTICAL_PRODUCT` (typed as `ShopperProducts.schemas['Product']`).
- Short-circuit the `_app.tsx` loader to return fixture categories.
- Short-circuit the `_app.product.$productId.tsx` loader to resolve the fixture product.

Restore the normal SCAPI calls once real credentials are available.

### 4. Run the component extension audit before coding

For each area you intend to change, decide one of three outcomes **before** writing code:

```
Does the change only affect visual tokens (color, font, spacing)?
  └─ YES → Token / CVA-only change. brand.css handles most of it.
  └─ NO  → Is the structural change needed by only one vertical?
              └─ YES → src/extensions/<vertical>/ via UITarget injection. Never touch core.
              └─ NO  → Add a slot / render-prop to the BASE component, each vertical fills it.
              └─ UNSURE → Build vertical-specific first; promote to base on the second consumer.
```

See [Component Authoring Reference](references/COMPONENT-AUTHORING.md) for the layer model and the extend-before-create rule.

### 5. Validate

- Run `pnpm dev` and verify home + PDP rendering in light and dark mode.
- Confirm there are no hardcoded color classes (no `bg-black`, `text-white`, raw hex).
- Run Storybook snapshot checks for changed components.

### 6. Sync the Figma kit

After code-side token decisions are stable, duplicate and sync the Figma kit. Use the `sfnext-create-figma-kit` skill (in the `storefront-next-figma` plugin). Always sync tokens **first**, then logo, then shared-component overrides, then new page-level frames.

## Execution modes

The same workflow runs in two modes:

- **Assisted (IDE automation):** follow the phase order strictly; use automation for repeatable edits and audits; keep human approval points for architecture decisions (extension vs base).
- **Manual:** use the workflow as a checklist; record each decision in a lightweight table (component area · decision type · target path · rationale); apply edits by hand.

## Required outcomes

- Brand token updates isolated to `brand.css` (and optional vertical override files).
- No primitive forks under `src/components/ui/`.
- Fixture short-circuit works locally without SCAPI dependency.
- Extension-vs-base decisions documented and approved.
- Figma sync executed after code decisions are finalized.

## Verification

Before marking the task complete, run from the monorepo root:

```bash
pnpm typecheck
pnpm lint
pnpm test-storybook:snapshot:agent
```

All three must pass with zero errors and zero warnings.

## Related Skills

- `storefront-next:sfnext-components` - Engineering component patterns (createPage, Suspense, shadcn)
- `storefront-next:sfnext-extensions` - Extension system and UITarget injection
- `storefront-next-figma:sfnext-create-figma-kit` - Syncing the brand tokens into the Figma kit

## Reference Documentation

- [Token System Reference](references/TOKEN-SYSTEM.md) - Full token map, semantic class meanings, dark mode rules
- [Component Authoring Reference](references/COMPONENT-AUTHORING.md) - Layer model, CVA, extend-before-create
- [Project Structure Reference](references/PROJECT-STRUCTURE.md) - Monorepo and theme file layout
- [Troubleshooting Reference](references/TROUBLESHOOTING.md) - Token, snapshot, and lint pitfalls
