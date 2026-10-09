# Registry and Loading

## The static registry

`src/lib/page-designer/static-registry.ts` maps fully-qualified component ids to lazy importers. The `staticRegistry` Vite plugin generates it from every `@Component` under `src/components` when `pnpm dev` or `pnpm build` starts, and again on hot updates. Everything between `// STATIC_REGISTRY_START` and `// STATIC_REGISTRY_END` is overwritten; do not edit it by hand and do not add entries manually.

Shape of the generated code (your file lists your project's components):

```typescript
const staticRegistryImporters = [
    () => import('../../components/hero/index'),
    () => import('../../components/product-carousel/index'),
    // ...
] as const;

export function initializeRegistry(targetRegistry = registry): void {
    targetRegistry.registerImporter('Content.hero', staticRegistryImporters[0]);
    targetRegistry.registerImporter('Layout.productCarousel', staticRegistryImporters[1], {
        loader: 'loader',
        fallback: 'fallback',
    });
}
```

- Ids are `<group>.<typeId>`, so the `typeId` in `@Component('hero', ...)` plus `group: 'Content'` becomes `Content.hero`. These ids must match what Business Manager sends.
- The third argument records which named exports the module has: `loader` (server data) and `fallback` (Suspense skeleton). The plugin derives them from your exports.
- To see which components your project registers, read the generated file rather than relying on a fixed list.

If a new component is missing from the registry, the usual cause is that it is outside `src/components`, the `@Component` first argument is not a string literal, or the dev server was not running when the file changed. Restart `pnpm dev` or run `pnpm build`.

## Entry wiring (do not break)

`initializeRegistry()` is called once at module top level in `src/entry.server.tsx` and synchronously in `src/entry.client.tsx`, before any component markers are scanned. Keep it there; moving it into a React render function breaks registration ordering.

`vite-plugins/storefront-next.ts` enables the plugin with:

```typescript
staticRegistry: {
    componentPath: 'src/components',
    registryPath: 'src/lib/page-designer/static-registry.ts',
    preloadManifest: true,
}
```

`preloadManifest: true` builds the resource-hint manifest that `critical` regions and per-component preload hints depend on. Keep it on.

## How a page renders

1. The route loader calls `fetchPageWithComponentData(args, params)`.
2. It fetches the page (SCAPI Shopper Experience, resolved from the Data Store when that middleware is active), walks every region and nested region, and for each component whose registry entry has a `loader` calls it with `{ componentData, context, request }`. The resulting promises are stored as `page.componentData[component.id]`.
3. `<Region page={page} regionId="..." />` resolves each component's module from the registry, wraps it in Suspense (using the module's `fallback`), awaits that component's promise, and renders the default export with the attribute props plus `data`, `component`, `designMetadata` and `regionId`.

Because data is attached to the page, there is no separate `componentData` return key and no `componentData` prop on `<Region>`.

## Fetching a page

```typescript
import { fetchPageWithComponentData } from '@/lib/page-designer/page-loader.server';

// Fixed page by id
fetchPageWithComponentData(args, { pageId: 'homepage' });

// By aspect (page assigned to a product or category in Business Manager)
fetchPageWithComponentData(args, { aspectType: 'pdp', productId, categoryId });
fetchPageWithComponentData(args, { aspectType: 'plp', categoryId });
```

Return the promise unawaited for a non-critical page (React Router streams it), or `await` it when a `critical` region needs the page synchronously. `fetchPageFromLoader` (same module) is the lower-level call that returns the raw page without `componentData`; routes use `fetchPageWithComponentData`.

Single components (for example an embedded content block or the preview route) use `fetchComponentWithComponentData` from `@/lib/page-designer/component-loader.server`.

## Module contract

| Export | Required | Notes |
|--------|----------|-------|
| default | yes | The React component. `forwardRef` components are fine. |
| `fallback` | yes | Lightweight skeleton; gets the same attribute props; reserve dimensions to avoid layout shift. No hooks that suspend, no fetching. |
| `loader` | optional | Must be a function `({ componentData, context, request }) => Promise`. Server only (stripped from the client bundle). Attributes are at `componentData.data`. |
| `clientLoader` | optional | Client-only counterpart (stripped from the server bundle). |

A `loader` that is an object (`{ server, client }`) is not callable; the loader never runs and `data` is undefined. Export the function: `export const loader = loaders.server`.

Loader guidance: return `null` when nothing is configured, fetch independent resources with `Promise.all`, do not swallow errors (the component's error boundary hides only that component), and reuse the shared `@/lib/api/*.server` helpers rather than building SCAPI calls inline.

## Critical regions

By default regions stream: the shell renders, then each component swaps in. For above-the-fold content that must be in the first HTML (hero, LCP image), make the region critical.

```tsx
export async function loader(args: Route.LoaderArgs) {
    const page = await fetchPageWithComponentData(args, { pageId: 'homepage' }); // must be resolved
    const recommendations = fetchRecommendations(args.context);                  // stay deferred
    return { page, recommendations };
}

export default function Home({ loaderData }: Route.ComponentProps) {
    return <Region page={loaderData.page} regionId="headerbanner" critical />;
}
```

- `critical` is page mode only; nested component regions inherit it.
- The page must already be resolved; omit `fallbackElement` on a critical region.
- Each component's own `loader` data still streams inside its local Suspense boundary.
- Use it sparingly; it delays the initial shell. Never on below-the-fold or catch-all regions.
- Stylesheets added through a route's `links` export should use `createStorefrontStylesheetLink` from `@salesforce/storefront-next-runtime/design/react/preload` so critical component styles keep a stable cascade order.

See "Critical Page Regions" in `docs/README-PAGE-DESIGNER.md` for the full behavior.

## Error handling

Do not pass `errorElement` to show hard-coded content when a page is unconfigured. That hides setup problems, forces extra fetches in the loader, and bypasses merchant control. Use `fallbackElement` for loading states, or render nothing when a region is empty. The home route's existing `errorElement` is a legacy pattern; do not copy it to new routes.
