---
name: sfnext-page-designer
description: >-
  Build merchant-editable Page Designer content in a Storefront Next project: components decorated with @Component/@AttributeDefinition/@RegionDefinition, page routes decorated with @PageType, <Region> rendering, fetchPageWithComponentData, component loaders and fallbacks, the generated static registry, and the pnpm cartridge:generate / cartridge:validate / cartridge:deploy workflow. Use when adding or editing a Page Designer component, exposing a region on a route (home, PDP, PLP, search), fetching a page by pageId or aspectType, marking a Region critical, debugging a component that does not appear in the Business Manager palette or renders empty, or reviewing Page Designer code. Do not use for classic ISML/SFRA Page Designer (use `b2c:b2c-page-designer`), for turning a Figma frame into blocks (use `figma-to-sfnext-pagedesigner:figma-to-sfnext-pagedesigner`), or for plain React components that merchants never edit (use `storefront-next:sfnext-components`).
---

# Page Designer in Storefront Next

In Storefront Next your React components are the Page Designer components. You annotate them with decorators, the build generates Business Manager metadata (JSON) from those decorators, and at runtime a route loader fetches the page structure from the Shopper Experience API and `<Region>` renders it.

The in-project guide is `docs/README-PAGE-DESIGNER.md` and the rules in `AGENTS.md` apply; this skill is the task-oriented path through them. Where the guide and the source disagree, trust the source.

## Pieces and where they live

| Piece | Location in your project |
|-------|--------------------------|
| Decorators (`Component`, `AttributeDefinition`, `RegionDefinition`, `PageType`) | `@/lib/decorators` (`src/lib/decorators/`) |
| Page fetch with per-component loader promises | `fetchPageWithComponentData` in `@/lib/page-designer/page-loader.server` |
| Single-component fetch (preview, embedded) | `fetchComponentWithComponentData` in `@/lib/page-designer/component-loader.server` |
| Region renderer | `Region` from `@/components/region` |
| Generated registry (do not hand-edit) | `src/lib/page-designer/static-registry.ts` |
| Runtime hooks (`usePageDesignerMode`) | `@salesforce/storefront-next-runtime/design/react/core` |
| Design/preview mode detection in loaders | `isDesignModeActive` / `isPreviewModeActive` from `@salesforce/storefront-next-runtime/design/mode` |
| Generated Business Manager metadata | `cartridges/app_storefrontnext_base/cartridge/experience/{components,pages,aspects}` |

The runtime package's `/design` entry exports only the registry. Decorators come from your project, not from `@salesforce/storefront-next-runtime`.

## Workflow

1. Create or edit the component (metadata class, props, default export, `fallback`, optional `loader`) under `src/components/<name>/index.tsx`.
2. Run `pnpm dev` (or `pnpm build`). The Vite plugin scans `src/components` for `@Component` and rewrites the registry between the `STATIC_REGISTRY_START/END` markers.
3. `pnpm cartridge:generate` writes the metadata JSON (`pnpm build` runs it for you).
4. `pnpm cartridge:validate` checks the generated JSON against the schemas. Generation also fails on an invalid attribute config (for example a bad `searching` combination).
5. `pnpm cartridge:deploy` uploads the cartridge to the B2C instance (`pnpm cartridge:deploy -- --delete` removes old cartridge files first). The optional MCP tool `cartridge_deploy` does the same. See `b2c-cli:b2c-code` for credentials and code-version handling.
6. In Business Manager, merchants build pages from the new palette entries. See [Business Manager](references/BUSINESS-MANAGER.md).

## A component

```tsx
// src/components/promo-banner/index.tsx
import { AttributeDefinition, Component, RegionDefinition } from '@/lib/decorators';
import { DynamicImage } from '@/components/dynamic-image';
import { type Image } from '@/types';
import { cn } from '@/lib/utils';

@Component('promoBanner', {
    name: 'Promo Banner',
    description: 'Headline and optional image. Headline text and alignment are editable.',
    group: 'Content',
})
@RegionDefinition([])
export class PromoBannerMetadata {
    @AttributeDefinition({ id: 'headline', name: 'Headline', type: 'string', required: true, defaultValue: 'Spring sale' })
    headline?: string;

    @AttributeDefinition({ id: 'image', name: 'Image', type: 'image' })
    image?: Image;

    @AttributeDefinition({ id: 'align', name: 'Alignment', type: 'enum', values: ['left', 'center'], defaultValue: 'left' })
    align?: 'left' | 'center';
}

interface PromoBannerProps {
    headline?: string;
    image?: Image;
    align?: 'left' | 'center';
    className?: string;
}

// Page Designer also injects component, data, designMetadata and regionId.
// Never spread them onto a DOM element; destructure them out first if you forward ...rest.
export default function PromoBanner({ headline = 'Spring sale', image, align = 'left', className }: PromoBannerProps) {
    return (
        <section className={cn('relative', align === 'center' && 'text-center', className)}>
            {image?.url && <DynamicImage src={image.url} alt="" />}
            <h2>{headline}</h2>
        </section>
    );
}

// REQUIRED. Rendered in a Suspense boundary; receives the same attribute props. Keep it light.
export function fallback() {
    return <div className="h-48 animate-pulse bg-muted" />;
}
```

Rules that matter:

- Attribute values arrive as props named after the class field, so the field name and `id` must agree.
- The metadata class must be `export`ed; the generator only sees exported classes.
- The `typeId` must be a string literal. It is stored as `<group>.<typeId>` (default group `storefrontnext_base`), for example `Content.promoBanner`. Use the `group` option (`Content`, `Layout`, ...) so related components sit together in the palette.
- An `image` attribute delivers an object (`{ url, focalPoint?, metaData? }`), typed `Image` from `@/types`, not a string. Check `src/components/hero/index.tsx` for the pattern.
- `name` and `description` are what merchants read in Business Manager; omitted ones fall back to the raw id.
- Full option tables, attribute types, enums, nested regions and cross-group refs: [Decorator Patterns](references/DECORATOR-PATTERNS.md).

## A loader

Export a callable named `loader` when the component needs data (products, categories, your own API). It receives `{ componentData, context, request }`; `componentData` is the whole SCAPI component object, so merchant-set attributes live at `componentData.data`.

```tsx
// src/components/promo-products/loaders.ts
import type { LoaderFunctionArgs } from 'react-router';
import type { ShopperExperience } from '@/scapi';
import { fetchProductsByIds } from '@/lib/api/products.server';

export const loader = async (args: { componentData: unknown; context: LoaderFunctionArgs['context'] }) => {
    const comp = args.componentData as ShopperExperience.schemas['Component'];
    const { productIds } = (comp.data ?? {}) as { productIds?: string };
    if (!productIds) return null;
    return fetchProductsByIds(args.context, productIds.split(','));
};
```

```tsx
// src/components/promo-products/index.tsx
export { loader } from './loaders';
export function fallback() { /* skeleton with reserved height */ }
export default function PromoProducts({ data }: { data?: Product[] | null }) { /* ... */ }
```

- The exported `loader` must be a function. An object such as `{ server: fn }` is silently ignored and `data` stays undefined; unwrap it (`export const loader = loaders.server`), as `product-tile/index.tsx` does.
- The loader runs on the server only (stripped from the client bundle), so it may import `*.server` modules; the component file must not. An optional `clientLoader` export is client-only.
- Return `null` when nothing is configured, fetch in parallel with `Promise.all`, and let errors propagate so only that component is hidden.
- The registry records `{ loader: 'loader' }` and `{ fallback: 'fallback' }` capability flags for you on regeneration.

More on the registry shape, group-qualified ids, preload manifest and entry wiring: [Registry and Loading](references/COMPONENT-REGISTRY.md).

## A page route

Routes bind a URL to a Page Designer page template and render its regions. Routes with `@PageType` today: home (`_app._index.tsx`), PLP (`_app.c.$.tsx`), PDP (`_app.p.$.tsx`), search (`_app.search.tsx`), about-us (`_app.about-us.tsx`), and the component preview route. Cart, checkout, account and auth do not use Page Designer.

```tsx
import { Region } from '@/components/region';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';

@PageType({
    name: 'Landing Page',
    description: 'Campaign landing page with a banner and a main content area',
    supportedAspectTypes: [],
})
@RegionDefinition([
    { id: 'banner', name: 'Banner Region', maxComponents: 1 },
    { id: 'main', name: 'Main Region' },
])
export class LandingPageMetadata {}

export function loader(args: Route.LoaderArgs) {
    return { page: fetchPageWithComponentData(args, { pageId: 'landing' }) };
}

export default function Landing({ loaderData }: Route.ComponentProps) {
    return (
        <>
            <Region page={loaderData.page} regionId="banner" />
            <Region page={loaderData.page} regionId="main" />
        </>
    );
}
```

- Fetch by `{ pageId }` for a fixed page, or by aspect: `{ aspectType: 'pdp', productId, categoryId? }` and `{ aspectType: 'plp', categoryId }`. The `aspectType` passed to the fetch must agree with `@PageType.supportedAspectTypes` (`['pdp']`, `['plp']`, or `[]` for fixed-page routes such as home); a mismatch shows the wrong template in Business Manager with no error.
- `fetchPageWithComponentData` attaches the per-component loader promises to the page (`page.componentData`). `<Region>` reads them itself; it takes no `componentData` prop, and the loader returns just `{ page }`. It resolves to `null` when the page is missing (404) or SCAPI errors, so empty regions are the normal unconfigured state.
- `<Region page={...}>` accepts a promise and renders in Suspense. Add `fallbackElement` only for a visible skeleton.
- Add `critical` to a page-level region only for above-the-fold or LCP content, and only with an awaited page (`page: await fetchPageWithComponentData(...)`), as `_app._index.tsx` does. Never on below-the-fold or catch-all regions. Details in [Registry and Loading](references/COMPONENT-REGISTRY.md).
- Nested regions inside a component use component mode, synchronously: `<Region component={component} regionId="content" />`. No Suspense wrapper, no `fallbackElement`, no promises. See `src/components/grid/index.tsx`.
- Do not use `errorElement` to render hard-coded content for an unconfigured page: it defeats merchant control and forces loaders to fetch data only for the fallback. The home route still contains such an `errorElement`; do not copy it. Use `fallbackElement` for loading and render nothing for empty.
- Metadata classes on routes are empty, exported, and never carry `@AttributeDefinition`.

## Design and preview mode

Business Manager loads your storefront in an iframe. In loaders use `isDesignModeActive(request)` / `isPreviewModeActive(request)` (the page loader already does and switches to the `pageId`/`pdToken` passed by Business Manager). In components use `usePageDesignerMode()` from `@salesforce/storefront-next-runtime/design/react/core`. `PageDesignerInit` (`src/page-designer-init.tsx`, rendered by `root.tsx`) blocks link navigation while editing and loads design-mode styles; do not remove it.

## Verify before you finish

- [ ] Metadata class exported; `typeId` literal; `group` set; every attribute has `name`, `description`, correct `type`
- [ ] Default export is the component; `fallback` exported and lightweight; `loader` (if any) is a function
- [ ] Every `<Region regionId>` matches a `@RegionDefinition` id, and vice versa
- [ ] `pnpm cartridge:generate && pnpm cartridge:validate` pass; the component is in `static-registry.ts`
- [ ] Review against [Review Checklist](references/REVIEW-CHECKLIST.md); symptoms in [Troubleshooting](references/TROUBLESHOOTING.md)

## Reference Documentation

- [Decorator Patterns](references/DECORATOR-PATTERNS.md) - options, attribute types, regions, page types
- [Registry and Loading](references/COMPONENT-REGISTRY.md) - static registry, loaders, critical regions, entry wiring
- [Business Manager](references/BUSINESS-MANAGER.md) - `route` and `aspectTypeIds`, page setup, palette
- [Review Checklist](references/REVIEW-CHECKLIST.md) - what to check in a component or page route
- [Troubleshooting](references/TROUBLESHOOTING.md) - component missing, empty, or wrong data

## Related Skills

- `storefront-next:sfnext-components` - component conventions, shadcn primitives, Storybook
- `storefront-next:sfnext-data-fetching` - loaders, `createApiClients`, streaming with Suspense/Await
- `storefront-next:sfnext-scapi` - calling SCAPI from loaders and actions
- `storefront-next:sfnext-performance` - LCP, preload, critical data
- `storefront-next:sfnext-theming` - tokens and brand styling for new components
- `storefront-next:sfnext-testing` - component and story tests
- `storefront-next:sfnext-deployment` - shipping the storefront bundle
- `figma-to-sfnext-pagedesigner:figma-to-sfnext-pagedesigner` - Figma frame to Page Designer blocks
- `b2c:b2c-page-designer` - classic (ISML/SFRA) Page Designer
- `b2c-cli:b2c-code` - deploying cartridges and code versions
