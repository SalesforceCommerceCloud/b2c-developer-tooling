---
name: figma-to-sfnext-pagedesigner
description: Convert a Figma frame into one or more live Storefront Next Page Designer blocks in one shot. Use whenever the user provides a Figma URL and wants the design to become merchant-authorable Page Designer components in a Storefront Next project. Requires the Figma MCP server (and a browser MCP for visual validation).
---

# Skill: figma-to-sfnext-pagedesigner

Convert a Figma frame into one or more live Storefront Next Page Designer blocks in one shot.

**One block per section.** Inspect the top-level frame and identify distinct visual sections (hero, feature strip, product row, footer band, etc.). Each section becomes its own PD component with its own file, typeId, and decorator. Run Phases 1–4 once per section before moving to the next.

## Prerequisites

- **Figma MCP server** configured in your AI tool — the skill reads design context through it. Without it, the skill can only act as a manual checklist.
- **Browser MCP** (Playwright or similar) — for the Phase 5 visual validation. Optional but recommended.
- A **Storefront Next** project in a git repo, with the `sfnext` CLI available (`pnpm sfnext …`).
- `gh` CLI authenticated (`gh auth status`) if you want the skill to clone/push for you.
- A Figma frame URL that includes a `node-id`.

## When to use

Invoke this skill (`/figma-to-sfnext-pagedesigner`) whenever the user provides a Figma URL and wants the design to become a merchant-authorable Page Designer component in a Storefront Next project.

Do NOT invoke this when:
- The user only wants React/Tailwind code (no PD integration needed) — use the `figma-design-to-code` skill directly.
- The target project is SFRA/ISML, not Storefront Next.

---

## Required inputs (ask if missing)

| Input | Example |
|---|---|
| Figma node URL (must include `node-id`) | `https://www.figma.com/design/abc123/...?node-id=1-2` |
| Git repo URL (or a local path to the project) | `https://github.com/org/my-storefront` |
| PD group (palette folder) | `Content` |
| Target branch | `main` or a feature branch name |

Do not ask the user for typeIds, display names, or descriptions upfront — derive these from the section names discovered in the frame and confirm them in the approval gate (Phase 1, step 4).

If the Figma URL has no `node-id` query param, stop and ask the user to select the frame in Figma and copy the link — never guess a node ID.

### Repo setup

If the repo is not already cloned locally, run:
```bash
gh repo clone <github-url>
cd <repo-name>
pnpm install
```

Check out the target branch (or create a feature branch if pushing directly to main is not appropriate):
```bash
git checkout -b feat/pd-blocks-from-figma
```

All file writes in Phases 1–3 operate on this local clone.

---

## Pre-flight reads (do these before writing any code)

1. Read `references/PAGE-DESIGNER-SFN.md` (bundled alongside this skill) — mental model for PD + Storefront Next.
2. Read the `figma-design-to-code` skill (from the official Figma plugin, if installed) — it governs correct `get_design_context` usage. If it isn't available, fall back to `get_design_context` + a screenshot and treat the design tokens as reference only.
3. Read `src/theme/tokens/brand.css` — know which design tokens exist AND their current values, so you can spot where the Figma design diverges and needs a token update (Phase 1b.1), not just which classes are available.
4. Scan `src/components/` — identify shared atoms to reuse rather than rebuild.

---

## Phase 1 — Section plan + authorable field approval (STOP FOR USER SIGN-OFF)

**Goal:** before writing any code, show the user exactly what blocks will be created and what merchants will be able to edit in each one. Do not proceed to Phase 2 until the user approves.

### 1a — Identify sections

Call `get_design_context` on the top-level frame. Scan the returned structure and screenshot to identify distinct visual sections (e.g. hero, feature strip, product row, testimonial, footer band). Each becomes one PD block.

List them:

```
Sections detected:
  1. Hero Banner        → typeId: heroBanner        file: hero-banner
  2. Feature Strip      → typeId: featureStrip       file: feature-strip
  3. Product Row        → typeId: productRow         file: product-row
```

Propose typeId and file name for each. The user can rename before approving.

### 1b — For each section, list proposed authorable fields with default values

Show a table per block. Include a **Default value** column populated from the actual content visible in the Figma design — this is what merchants will see pre-filled when they first drag the block onto a page:

```
── Hero Banner (heroBanner) ──────────────────────────────────
  Field label       Prop name        PD type  Req?  Default value
  ---------------------------------------------------------------
  Headline          headline         string   yes   "Fresh Drops This Week"
  Subheading        subheading       string   no    "New styles just landed"
  Background Image  backgroundImage  image    yes   (empty — library asset needed)
  CTA Label         ctaLabel         string   no    "Shop Now"
  CTA URL           ctaUrl           url      no    (empty — real URL needed)
  Dark text?        isDarkText       boolean  no    false

── Feature Strip (featureStrip) ──────────────────────────────
  ...
```

**Default value rules:**
- String and markup fields: copy the literal text visible in the Figma frame.
- Boolean fields: infer from the design state shown (dark overlay visible → `true`).
- `image`, `url`, `product`, `category` types: leave empty — these require live assets the Figma mock cannot supply. Note them as "(empty — needs real asset)" so the merchant knows to fill them.

For each field, apply type inference:
- `*Url`, `*Link`, `*Href` → `url`
- `*Image`, `*Img`, `*Src`, `*Photo` → `image`
- `is*`, `show*`, `has*`, `enable*` → `boolean`
- `*Count`, `*Num`, `max*`, `min*` → `integer`
- Long body copy / rich text → `markup`
- Product reference → `product`; category reference → `category`
- Anything else → `string`

Mark layout-only props (padding, rotation, shadow) as **hardcoded** — do not list them as fields.

**Product detection:** if the section shows product cards, product names, prices, star ratings, or imagery that looks like it comes from a catalog (not a static hero image), flag it as `needs_server_loader = true` and list one `product` type field per slot (e.g. `Product 1`, `Product 2`). Do not try to carry product IDs as default values — those fields must be filled by the merchant in PD.

### 1b.1 — Reconcile brand tokens against the design

Walking a Figma design into the codebase is **not just adding new components — it also means updating the base design tokens the whole storefront already uses** wherever the design diverges from them. This is easy to miss: you build the new block correctly against existing tokens, but the design actually specifies a *different* primary color / radius / font, and the existing token is now wrong. The block looks right; the rest of the storefront (buttons, links, focus rings) is now off-brand.

For each section, before finalizing fields, compare the Figma design's core visual values against what's in `src/theme/tokens/brand.css` (and any shadcn/tailwind theme vars — `--primary`, `--accent`, `--background`, `--foreground`, `--radius`, font families):

- **Primary / accent / brand colors** — if the Figma design's buttons, links, or highlights use a color that differs from the current `--primary` / `--accent` token value, that's a **token update**, not a per-component override. Do NOT hardcode the new hex in the block; update the token so every existing component (buttons, badges, focus states) inherits it.
- **Typography** — heading/body font family, weights, and scale. If the design uses a different type family than the token defines, flag the font token for update.
- **Radius, spacing scale, shadows** — if consistently different across the design, treat as token updates.

Produce a **token diff table** for the approval gate:

```
── Token reconciliation ──────────────────────────────────────
  Token             Current (brand.css)   Figma design    Action
  --------------------------------------------------------------
  --primary         #1f2a44               #E11D48         UPDATE (primary buttons are pink in design)
  --radius          0.5rem                0.75rem         UPDATE
  --font-heading    "Inter"               "Playfair"      UPDATE
  --accent          #f5a623               #f5a623         keep (matches)
```

**Rules:**
- Prefer a token update over a per-component hardcoded value whenever the changed value is something shared components already consume (button color, link color, radius, font). A one-off color used only in this one block stays local to the block.
- Never silently hardcode a hex that contradicts an existing token — that leaves the storefront half-rebranded.
- If unsure whether a divergence is intentional (design drift vs. a deliberate one-off), list it in the table and ask in the approval gate rather than guessing.

### 1c — STOP. Present to user and wait for approval.

Output the section plan, all field tables, **and the token reconciliation table (1b.1)**, then explicitly ask:

> "Does this look right? You can add fields, remove fields, change types, rename labels, merge/split sections, or adjust which token updates to apply before I start writing code."

**Do not write any files until the user confirms.** Accept freeform corrections — e.g. "make headline required", "add a body copy field to Hero as markup", "merge sections 2 and 3 into one block", "drop the boolean, that's always dark".

Update the tables to reflect corrections, then confirm once more if changes were substantial. When the user says go, lock the field plan and proceed to Phase 2.

### 1d — Apply approved token updates, then write the React component (after approval)

**First, apply any token updates approved in 1b.1.** Edit `src/theme/tokens/brand.css` (and any theme var file) to the new values *before* writing components, so the new block and all existing components render against the corrected tokens. This is a real edit to the base design — commit it alongside the new component in Phase 4.

Then, for each section, write `src/components/<name>/index.tsx`:
- Props typed as a plain TypeScript interface — all approved authorable fields plus any layout-only props needed for rendering.
- No decorator imports yet.
- Use brand tokens from `brand.css` as Tailwind utilities or CSS variables — no hardcoded hex. If the design needed a shared value changed (primary color, radius, font), that lives in the updated token, not in the component.
- Reuse existing shared components where they match design intent.

---

## Phase 2 — PD decorator metadata class (decorator mode only)

**Goal:** add the metadata class that tells Page Designer what attributes exist. Do not touch the React JSX.

Using the approved field plan from Phase 1, edit `src/components/<name>/index.tsx`:

### 2a — Imports (add at top)

```tsx
import { Component } from '@/lib/decorators/component';
import { AttributeDefinition } from '@/lib/decorators/attribute-definition';
import { RegionDefinition } from '@/lib/decorators';
```

### 2b — Metadata class (insert above the default export)

```tsx
/* v8 ignore start */
@Component('typeId', { name: 'Display Name', description: 'Description', group: 'Content' })
@RegionDefinition([])
export class <Name>Metadata {
    @AttributeDefinition({ id: 'headline', name: 'Headline', type: 'string', required: true, defaultValue: 'Fresh Drops This Week' })
    headline?: string;

    @AttributeDefinition({ id: 'ctaLabel', name: 'CTA Label', type: 'string', required: false, defaultValue: 'Shop Now' })
    ctaLabel?: string;

    @AttributeDefinition({ id: 'backgroundImage', name: 'Background Image', type: 'image', required: true })
    backgroundImage?: string;
}
/* v8 ignore end */
```

Rules:
- Set `defaultValue` for every `string`, `markup`, and `boolean` field using the value from the approved field plan.
- Do **not** set `defaultValue` on `image`, `url`, `product`, or `category` fields — these require real assets the Figma mock cannot provide.
- Only include props marked authorable in the plan. Layout props are not attributes.

### 2c — Attribute type inference

Apply these rules to each authorable prop name:

| Prop name pattern | PD attribute type |
|---|---|
| `*Url`, `*Link`, `*Href` | `url` |
| `*Image`, `*Img`, `*Src`, `*Photo` | `image` |
| `is*`, `show*`, `has*`, `enable*` | `boolean` |
| `*Count`, `*Num`, `max*`, `min*` | `integer` |
| Long body copy / rich text | `markup` |
| Anything else | `string` |

For product reference props → `product`. For category reference props → `category`.

### 2d — Regions (if has_regions = true)

Replace `@RegionDefinition([])` with named slot configs:

```tsx
@RegionDefinition([
    { id: 'main', name: 'Main Content', description: 'Primary content area', maxComponents: 10 },
])
```

### 2e — Product data (if the Figma section shows product cards, product names, prices, or imagery sourced from a catalog)

When a Figma section contains product data, the merchant should supply a product ID in PD and the component fetches live catalog data at render time.

**Decorator:** add a `product` type attribute for each product slot:

```tsx
@AttributeDefinition({ id: 'productId', name: 'Product', type: 'product', required: true })
productId?: string;
```

For multi-product blocks (e.g. a 3-up product row), use indexed slots:

```tsx
@AttributeDefinition({ id: 'product1Id', name: 'Product 1', type: 'product', required: true })
product1Id?: string;

@AttributeDefinition({ id: 'product2Id', name: 'Product 2', type: 'product', required: false })
product2Id?: string;
```

**Loader** — the thing the registry imports as `loader` MUST be a callable function. A top-level async function is the simplest correct shape:

```tsx
export async function loader({ componentData, context }: { componentData: any; context: any }) {
    const productId: string = componentData.data?.productId
    if (!productId) return null

    const product = await context.shopperProducts.getProduct({
        parameters: { id: productId, allImages: true },
    })
    return { product }
}
```

**⚠️ The #1 silent failure: exporting a non-callable as `loader`.** If the export named `loader` is anything other than a function, the registry gets a non-callable, the loader never runs, `data` is `undefined`, and the component's `return null` fallback hides the block entirely — with **no error**. You just see an empty space where the block should be.

Two ways this bites:
1. **The `{ server: fn }` object shape.** Some loaders are authored as `export const loader = { server: dataLoader }`. That object is not callable.
2. **Re-exporting the raw object.** `export { loader } from './loaders'` in `index.tsx` re-exports whatever `loaders.ts` called `loader` — if that was the `{ server: fn }` object, you've just re-exported a non-callable. This is the trap: it *looks* wired up.

**Correct convention:** the file the registry imports must ultimately export a callable `loader`. Either author it as a plain function (above), or unwrap the object at the export boundary:

```tsx
// in loaders.ts — export the callable directly, not the wrapper object
export const loader = dataLoader

// OR, if a { server: fn } object already exists, unwrap it where you export:
// index.tsx
import * as loaders from './loaders'
export const loader = loaders.server   // ✅ callable — NOT `export { loader } from './loaders'`
```

**Before committing a product block, verify the export is callable** — e.g. `import { loader } from './index'; typeof loader === 'function'`. If it's `'object'`, it's the wrapper bug.

For multi-product blocks, fetch in parallel:

```tsx
export async function loader({ componentData, context }: { componentData: any; context: any }) {
    const ids = ['product1Id', 'product2Id', 'product3Id']
        .map((k) => componentData.data?.[k] as string)
        .filter(Boolean)

    const products = await Promise.all(
        ids.map((id) =>
            context.shopperProducts.getProduct({
                parameters: { id, allImages: true },
            })
        )
    )
    return { products }
}
```

**React component** receives `data` (loader return) alongside the PD attributes. Destructure both from props:

```tsx
export default function ProductRow({ product1Id, data }: ProductRowProps & { data?: { products: Product[] } }) {
    const products = data?.products ?? []
    // render product cards from products array
}
```

**Flag `needs_server_loader = true`** in the prop triage and add `{ loader: 'loader' }` to the registry entry (Phase 3).

**Fallback skeleton:** for product blocks, export a skeleton so the Suspense boundary shows something while the loader runs:

```tsx
export function fallback() {
    return <div className="animate-pulse bg-muted h-64 w-full rounded" />
}
```

Register it: `{ loader: 'loader', fallback: 'fallback' }`

---

## Phase 3 — Registry

Add one import line to `src/lib/page-designer/static-registry.ts`.

Find the block where `registerImporter` calls are grouped (they are alphabetical by group then typeId in practice) and insert:

```ts
targetRegistry.registerImporter(
    'Group.typeId',
    () => import('../../components/<name>/index')
);
```

If the component has a loader, add the second argument:

```ts
targetRegistry.registerImporter(
    'Group.typeId',
    () => import('../../components/<name>/index'),
    { loader: 'loader' }
);
```

---

## Phase 4 — Commit, push, and ship

### 4a — Generate cartridge JSON locally (pre-commit validation)

```bash
pnpm cartridge:generate
```

Confirm the expected JSON files were written under `cartridges/`. If this fails, fix before committing — a broken decorator parse will also break CI.

### 4b — Commit and push

Stage the new component files, registry edit, generated cartridge JSON, **and any token updates from Phase 1d**:

```bash
git add src/components/<name>/index.tsx
git add src/lib/page-designer/static-registry.ts
git add src/theme/tokens/brand.css   # only if tokens were updated in 1d
git add cartridges/
git commit -m "feat: add <Name> Page Designer block from Figma"
git push origin feat/pd-blocks-from-figma
```

If token updates were substantial, prefer a separate commit (e.g. `chore: align brand tokens with Figma design`) so the rebrand is reviewable on its own.

If working directly on the target branch (e.g. main):
```bash
git push origin main
```

### 4c — What happens after push (inform the user)

Two things run in sequence after the push lands, typically via CI:

1. **MRT deploy** (`pnpm push` / `sfnext push`) — deploys the updated storefront bundle to MRT. The new React components are live in the storefront after this.

2. **Cartridge deploy** (`pnpm cartridge:deploy` / `sfnext deploy-cartridge`) — uploads the cartridge JSON to B2C. The new component types appear in the Page Designer palette after this step. If the project has `GENERATE_AND_DEPLOY_CARTRIDGE_ON_MRT_PUSH = true` in its config, this runs automatically as part of `pnpm push`.

Tell the user: "Once CI completes both steps, open Business Manager → Page Designer → Home page, and the new blocks will appear in the component palette ready to author. The text fields will be pre-filled with the copy from your Figma design — you'll just need to swap in real images and URLs."

If CI is not configured, provide the manual fallback:
```bash
pnpm cartridge:deploy   # upload metadata to B2C
pnpm push               # deploy storefront to MRT
```

If `cartridge:deploy` fails with `401 invalid_client`, the most common cause is a stale, pod-specific Account Manager host in `dw.json` (or a wrong `SFCC_SERVER`). Test the OAuth token against `account.demandware.com` versus the configured host, and correct the AM host before retrying — the credentials are usually fine.

---

## Phase 5 — Verify

### 5a — Cartridge and palette check

1. Confirm the cartridge JSON was written:
   ```
   cartridges/app_storefrontnext_base/cartridge/experience/components/<Group>/<typeId>.json
   ```
2. If browser MCP is available: open Business Manager → Merchant Tools → Content → Experience Manager → Page Designer, confirm each component appears in the component palette under its group.

### 5b — Visual design match (Chrome)

This step is **required** when a browser MCP is available. Do a side-by-side design fidelity check:

1. Start `pnpm dev` and navigate to the route that includes the new blocks.
2. Take a screenshot of the rendered page in Chrome.
3. Take a screenshot of the original Figma frame (via `get_screenshot` or the design context screenshot captured in Phase 1).
4. Compare them. For each block, check:
   - Typography (weight, size, colour, line-height)
   - Spacing and layout proportions
   - Image/media placement
   - Brand token colours (no regressions to wrong colour values) — **including shared elements the design also restyles: primary/secondary buttons, links, badges, focus rings. If a button in the design is a different colour than the storefront currently renders, that's a token miss from Phase 1b.1, not a per-block fix.**
   - Product blocks: confirm the block actually rendered with data (not an empty/hidden fallback — the loader-callable bug in Phase 2e produces a silent blank).
   - Mobile breakpoint if the Figma includes a mobile frame
5. **Report the diff to the user.** List any visible discrepancies with the prop, token, or CSS class responsible. If a fix belongs in a token rather than the component, say so.
6. Fix discrepancies in the React component, then re-screenshot until the match is acceptable. Do not mark the skill complete with known visual gaps.

If `pnpm dev` is not running or browser MCP is unavailable, explicitly tell the user that visual validation was skipped and they should do it manually before authoring in Production Page Designer.

---

## Failure modes and recovery

| Symptom | Fix |
|---|---|
| `get_design_context` returns no Code Connect hints | Project has no `.figma.ts` files yet — use raw design tokens and screenshot as reference only. |
| `cartridge:generate` exits with decorator parse error | The metadata class must be a `class` (not interface) and decorators must be on class fields, not function params. |
| Component not appearing in PD palette after deploy | Check BM → Administration → Site Development → Development Setup for cartridge assignment; the storefront cartridge must be in the cartridge path. |
| `markup` type attribute renders as escaped HTML | Use `dangerouslySetInnerHTML={{ __html: props.bodyText }}` for markup-typed attributes — they send raw HTML. |
| Registry entry causes a Vite HMR error | Ensure the import path resolves — run `pnpm build` to get a full error trace. |
| Product block renders as a blank/empty space, no error | The export named `loader` is not callable (a `{ server: fn }` object, or `export { loader } from './loaders'` re-exporting that object). The loader never runs, `data` is `undefined`, and `return null` hides the block. Fix: export a callable — `export const loader = loaders.server` or a plain `export async function loader(...)`. Verify with `typeof loader === 'function'`. See Phase 2e. |
| New block looks right but the rest of the storefront is off-brand (wrong button colour, radius, font) | A shared value in the Figma design diverged from an existing token and was missed. Update the token in `src/theme/tokens/brand.css` (Phase 1b.1 / 1d), don't hardcode it in the block. |

---

## Canonical example (structure of a finished block)

A completed block's `src/components/<name>/index.tsx` contains, in order:

1. Imports — React/Tailwind, shared components, and the PD decorators (`Component`, `AttributeDefinition`, `RegionDefinition`).
2. A `/* v8 ignore start */ … /* v8 ignore end */`-wrapped `@Component`-decorated metadata class declaring each authorable attribute with its `type`, `required`, and (for string/markup/boolean) `defaultValue`.
3. A plain TypeScript props interface.
4. For product blocks: a callable `export async function loader(...)` and an optional `export function fallback()` skeleton.
5. The default-exported React component, destructuring both the PD attributes and `data` (the loader return).

Brand values come from `brand.css` tokens as Tailwind utilities/CSS variables — never hardcoded hex.
