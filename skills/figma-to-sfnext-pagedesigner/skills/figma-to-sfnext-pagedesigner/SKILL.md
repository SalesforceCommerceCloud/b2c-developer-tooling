---
name: figma-to-sfnext-pagedesigner
description: >-
  Convert a Figma frame into merchant-authorable Storefront Next Page Designer blocks: splits the frame into sections, proposes attributes with defaults from the design copy, reconciles brand tokens, writes React components with @Component/@AttributeDefinition metadata, a required fallback and (for catalog sections) a product loader, generates and deploys the Business Manager cartridge JSON, and checks design fidelity. Use when the user gives a Figma URL (with node-id) and wants it to become Page Designer components in a Storefront Next project. Requires the Figma MCP server; a browser MCP is recommended. Do not use for plain React/Tailwind without Page Designer, for SFRA/ISML (use `b2c:b2c-page-designer`), or for the Page Designer API reference (use `storefront-next:sfnext-page-designer`).
---

# Skill: figma-to-sfnext-pagedesigner

Convert a Figma frame into one or more live Storefront Next Page Designer blocks in one shot.

**One block per section.** Inspect the top-level frame and identify distinct visual sections (hero, feature strip, product row, footer band, etc.). Each section becomes its own PD component with its own file, typeId, and decorator. Run Phases 1–4 once per section before moving to the next.

## Prerequisites

- **Figma MCP server** configured in your AI tool — the skill reads design context through it. Without it, the skill can only act as a manual checklist.
- **Browser MCP** (Playwright or similar) — for the Phase 5 visual validation. Optional but recommended.
- A **Storefront Next** project in a git repo (Node >= 24, pnpm >= 10.28), with the `sfnext` CLI available (`pnpm sfnext …`).
- A B2C instance and credentials for `pnpm cartridge:deploy` (see `b2c-cli:b2c-code`), and MRT access for `pnpm push` (see `b2c-cli:b2c-mrt`).
- `gh` CLI authenticated (`gh auth status`) only if you want the skill to clone the repo for you.
- A Figma frame URL that includes a `node-id`.

## When to use

Invoke this skill (`/figma-to-sfnext-pagedesigner`) whenever the user provides a Figma URL and wants the design to become a merchant-authorable Page Designer component in a Storefront Next project.

Do NOT invoke this when:
- The user only wants React/Tailwind code (no PD integration needed) — use the `figma-design-to-code` skill directly.
- The target project is SFRA/ISML, not Storefront Next (use `b2c:b2c-page-designer`).
- The user wants to sync a design kit or Code Connect mappings from brand tokens (use `storefront-next-figma:sfnext-create-figma-kit`).

For the decorator, registry, loader and `<Region>` reference used throughout, see `storefront-next:sfnext-page-designer`.

---

## Required inputs (ask if missing)

| Input | Example |
|---|---|
| Figma node URL (must include `node-id`) | `https://www.figma.com/design/abc123/...?node-id=1-2` |
| Git repo URL (or a local path to the project) | `https://github.com/org/my-storefront` |
| PD group (palette folder; the generated id is `<Group>.<typeId>`) | `Content` |
| Target branch | `main` or a feature branch name |

Use camelCase typeIds (for example `heroBanner`). Do not ask the user for typeIds, display names, or descriptions upfront — derive these from the section names discovered in the frame and confirm them in the approval gate (Phase 1, step 4).

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
3. Read `src/theme/tokens/core.css` (and `brand.css`, `header.css` as needed; see `storefront-next:sfnext-theming`) — know which design tokens exist AND their current values, so you can spot where the Figma design diverges and needs a token update (Phase 1b.1), not just which classes are available.
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

For each section, before finalizing fields, compare the Figma design's core visual values against what's in `src/theme/tokens/core.css` and `brand.css` (and any shadcn/tailwind theme vars — `--primary`, `--accent`, `--background`, `--foreground`, `--ui-radius`, font families):

- **Primary / accent / brand colors** — if the Figma design's buttons, links, or highlights use a color that differs from the current `--primary` / `--accent` token value, that's a **token update**, not a per-component override. Do NOT hardcode the new hex in the block; update the token so every existing component (buttons, badges, focus states) inherits it.
- **Typography** — heading/body font family, weights, and scale. If the design uses a different type family than the token defines, flag the font token for update.
- **Radius, spacing scale, shadows** — if consistently different across the design, treat as token updates.

Produce a **token diff table** for the approval gate:

```
── Token reconciliation ──────────────────────────────────────
  Token             Current (core.css)    Figma design    Action
  --------------------------------------------------------------
  --primary         #1f2a44               #E11D48         UPDATE (primary buttons are pink in design)
  --ui-radius       0.5rem                0.75rem         UPDATE
  --font-sans       "Inter"               "Playfair"      UPDATE
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

**First, apply any token updates approved in 1b.1.** Edit the token file in `src/theme/tokens/` where the variable lives (`core.css` for the palette and shape, `header.css` for header/footer, `brand.css` for `--brand-*`; fonts are in `src/theme/tailwind.css`) to the new values *before* writing components, so the new block and all existing components render against the corrected tokens. This is a real edit to the base design — commit it alongside the new component in Phase 4.

Then, for each section, write `src/components/<name>/index.tsx`:
- Props typed as a plain TypeScript interface — all approved authorable fields plus any layout-only props needed for rendering.
- No decorator imports yet; add them in Phase 2. Also plan a lightweight `fallback` export (Phase 2f).
- Use theme tokens (`src/theme/tokens/*.css`) as Tailwind utilities or CSS variables — no hardcoded hex. If the design needed a shared value changed (primary color, radius, font), that lives in the updated token, not in the component.
- Reuse existing shared components where they match design intent.

---

## Phase 2 — PD decorator metadata class (decorator mode only)

**Goal:** add the metadata class that tells Page Designer what attributes exist. Do not touch the React JSX.

Using the approved field plan from Phase 1, edit `src/components/<name>/index.tsx`:

### 2a — Imports (add at top)

```tsx
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { type Image } from '@/types';
```

### 2b — Metadata class (insert above the default export)

```tsx
@Component('typeId', { name: 'Display Name', description: 'Description', group: 'Content' })
@RegionDefinition([])
export class <Name>Metadata {
    @AttributeDefinition({ id: 'headline', name: 'Headline', type: 'string', required: true, defaultValue: 'Fresh Drops This Week' })
    headline?: string;

    @AttributeDefinition({ id: 'ctaLabel', name: 'CTA Label', type: 'string', required: false, defaultValue: 'Shop Now' })
    ctaLabel?: string;

    @AttributeDefinition({ id: 'backgroundImage', name: 'Background Image', type: 'image', required: true })
    backgroundImage?: Image;
}
```

Rules:
- The metadata class must be `export`ed, and each class field name must equal its attribute `id`; the field name is the prop name the component receives.
- `typeId` must be a string literal in camelCase. `group` is the palette folder; the registry id becomes `<Group>.<typeId>` (for example `Content.heroBanner`).
- An `image` attribute delivers an `Image` object (`{ url, metaData?, focalPoint? }`, from `@/types`), not a string. Render it with `image.url`.
- A `markup` attribute delivers raw HTML; render it with `dangerouslySetInnerHTML` only from trusted Page Designer content.
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

For product reference props → `product`. For category reference props → `category`. Other supported types are `text`, `file`, `page`, `enum`, `custom` and `cms_record`; see `storefront-next:sfnext-page-designer`.

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

**Loader** — `componentData` is the whole SCAPI component object, so merchant-set attributes live at `componentData.data.*`. The loader runs on the server only (it may import `*.server` modules; the component file must not). The thing the registry imports as `loader` MUST be a callable function. A top-level async function is the simplest correct shape:

```tsx
import type { LoaderFunctionArgs } from 'react-router'
import { fetchProductById } from '@/lib/api/products.server'

export async function loader({ componentData, context }: { componentData: { data?: Record<string, unknown> }; context: LoaderFunctionArgs['context'] }) {
    const productId = componentData.data?.productId as string | undefined
    if (!productId) return null

    const product = await fetchProductById(context, productId)
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
export async function loader({ componentData, context }: { componentData: { data?: Record<string, unknown> }; context: LoaderFunctionArgs['context'] }) {
    const ids = ['product1Id', 'product2Id', 'product3Id']
        .map((k) => componentData.data?.[k] as string | undefined)
        .filter((id): id is string => Boolean(id))
    if (ids.length === 0) return null

    // One batched SCAPI call for all slots
    const products = await fetchProductsByIds(context, ids)
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

**Flag `needs_server_loader = true`** in the prop triage. The registry records the `loader` flag for you (Phase 3).

### 2f — Fallback (required for every block)

Every component must export a lightweight `fallback` with reserved height; it renders in a Suspense boundary while the loader or component chunk loads:

```tsx
export function fallback() {
    return <div className="animate-pulse bg-muted h-64 w-full rounded" />
}
```


---

## Phase 3 — Verify the registry entry (no manual edit)

`src/lib/page-designer/static-registry.ts` is generated. When `pnpm dev` or `pnpm build` starts, the Vite plugin scans `src/components` for `@Component` and rewrites the block between the `STATIC_REGISTRY_START` / `STATIC_REGISTRY_END` markers, including `{ loader: 'loader' }` and `{ fallback: 'fallback' }` flags. Do not hand-edit it.

Run `pnpm dev` (or `pnpm build`) once, then confirm the file contains an entry for `'<Group>.<typeId>'` with the expected flags. A missing entry means the metadata class is not exported, the `typeId` is not a string literal, or the component is not under `src/components`.

### Placing the blocks on a page

Blocks appear in regions of a page. Merchants place them in Business Manager, but the page route must render that region: use `fetchPageWithComponentData` and `<Region page={...} regionId="..." />` (routes such as home already do). See `storefront-next:sfnext-page-designer` for routes, aspect types and `critical` regions. Do not pass `componentData` to `<Region>`.

---

## Phase 4 — Commit and deploy

### 4a — Generate cartridge JSON locally (pre-commit validation)

```bash
pnpm cartridge:generate
```

Confirm the expected JSON files were written under `cartridges/app_storefrontnext_base/cartridge/experience/`, then run `pnpm cartridge:validate` to check them against the schemas. If either fails, fix before committing — a broken decorator parse blocks the deploy too.

### 4b — Commit

Commit the new component file(s), the regenerated registry, the generated cartridge JSON, **and any token updates from Phase 1d**. If the token changes were substantial, keep them in a separate commit (e.g. `chore: align brand tokens with Figma design`) so the rebrand is reviewable on its own.

### 4c — Deploy

Two commands make the block live — run them directly against the target instance/environment:

1. **Cartridge deploy** (`pnpm cartridge:deploy` / `sfnext deploy-cartridge`; `-- --delete` removes old cartridge files first) — uploads the cartridge JSON to B2C. The new component types appear in the Page Designer palette after this. The optional MCP tool `cartridge_deploy` does the same.

2. **MRT deploy** (`pnpm push` / `sfnext push`) — deploys the storefront bundle to Managed Runtime so the new React components render (see `storefront-next:sfnext-deployment`).

Then tell the user: open Business Manager → Page Designer → the target page, and the new blocks appear in the component palette ready to author — text fields pre-filled with the copy from the Figma design; they just swap in real images, URLs, and product IDs.

If a deploy command fails, re-run it with `--log-level trace` for full diagnostics, and consult the `b2c-cli:b2c-code` and `b2c-cli:b2c-mrt` skills (if installed) — they cover auth, WebDAV, and deploy troubleshooting in depth.

---

## Phase 5 — Verify

### 5a — Cartridge and palette check

1. Confirm the cartridge JSON was written:
   ```
   cartridges/app_storefrontnext_base/cartridge/experience/components/<Group>/<typeId>.json
   ```
2. If browser MCP is available: open Business Manager → Merchant Tools → Content → Page Designer, confirm each component appears in the component palette under its group.

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
| `cartridge:generate` exits with decorator parse error or an invalid attribute config | The metadata class must be an exported `class` (not interface) and decorators must be on class fields, not function params. Check `typeId` is a literal and attribute options (for example `searching`) are valid. |
| Component not appearing in PD palette after deploy | Check BM → Administration → Site Development → Development Setup for cartridge assignment; the storefront cartridge must be in the cartridge path. |
| `cartridge:deploy` / `push` fails (auth, WebDAV, or connection error) | Re-run the command with `--log-level trace` for full diagnostics, and consult the `b2c-cli:b2c-code` / `b2c-cli:b2c-mrt` skills (if installed) — they cover auth and deploy troubleshooting. |
| `markup` type attribute renders as escaped HTML | Use `dangerouslySetInnerHTML={{ __html: bodyText }}` for markup-typed attributes — they send raw HTML. |
| Component missing from `static-registry.ts` | The metadata class is not exported, `typeId` is not a literal, or the file is outside `src/components`. Restart `pnpm dev` and re-check. More symptoms: `storefront-next:sfnext-page-designer` (Troubleshooting). |
| Product block renders as a blank/empty space, no error | The export named `loader` is not callable (a `{ server: fn }` object, or `export { loader } from './loaders'` re-exporting that object). The loader never runs, `data` is `undefined`, and `return null` hides the block. Fix: export a callable — `export const loader = loaders.server` or a plain `export async function loader(...)`. Verify with `typeof loader === 'function'`. See Phase 2e. |
| New block looks right but the rest of the storefront is off-brand (wrong button colour, radius, font) | A shared value in the Figma design diverged from an existing token and was missed. Update the token in `src/theme/tokens/` (Phase 1b.1 / 1d), don't hardcode it in the block. |
| Block shows only its skeleton or nothing | The component has no `fallback` export, or the page route does not render the region. See Phase 3. |

---

## Canonical example (structure of a finished block)

A completed block's `src/components/<name>/index.tsx` contains, in order:

1. Imports — React/Tailwind, shared components, and the PD decorators (`Component`, `AttributeDefinition`, `RegionDefinition`).
2. An exported `@Component`-decorated metadata class declaring each authorable attribute with its `type`, `required`, and (for string/markup/boolean) `defaultValue`.
3. A plain TypeScript props interface.
4. A required `export function fallback()` skeleton, and for product blocks a callable `export async function loader(...)`.
5. The default-exported React component, destructuring both the PD attributes and `data` (the loader return).

Brand values come from theme tokens as Tailwind utilities/CSS variables — never hardcoded hex.

## Related Skills

- `storefront-next:sfnext-page-designer` - decorators, registry, loaders, `<Region>`, troubleshooting
- `storefront-next:sfnext-theming` - brand tokens and theme files
- `storefront-next:sfnext-components` - component conventions
- `storefront-next:sfnext-deployment` - shipping the storefront bundle
- `storefront-next-figma:sfnext-create-figma-kit` - building the Figma kit from your tokens
- `b2c-cli:b2c-code` - cartridge and code-version deployment
- `b2c-cli:b2c-mrt` - Managed Runtime deploys
- `b2c:b2c-page-designer` - classic Page Designer
