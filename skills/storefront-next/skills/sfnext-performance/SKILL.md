---
name: sfnext-performance
description: >-
  Keep a Storefront Next storefront fast and self-review changes for performance: LCP, CLS and TBT, Suspense placement and granularity, stable promise identity, lazy-loaded modals and drawers with useDeferredUnmount, useDeferredRender, Region critical, DynamicImage and image priority, font loading, resource hints (links.preconnect), bundle size checks (pnpm bundlesize, BUNDLES_SIZE_ANALYZE), Lighthouse CI, and the performance.metrics / Server-Timing flags. Use for "page is slow", "LCP regression", "skeleton flashes", "bundle too big", "review my diff for performance", "hydration mismatch or extra re-renders", "waterfall of fetches", or before merging feature work that adds loaders, fetchers, modals and drawers or images. Do not use for loader/action mechanics (use `storefront-next:sfnext-data-fetching`), revalidation policy (use `storefront-next:sfnext-revalidation`), or accessibility (use `storefront-next:sfnext-accessibility`).
---

# Storefront Next Performance

Performance rules are part of `AGENTS.md` ("Performance & Data Rules") and detailed in `docs/README-PERFORMANCE.md`, `docs/README-SUSPENSE.md`, `docs/README-IMAGES.md` and `docs/README-PERFORMANCE-METRICS.md` in your project. This skill is the working summary plus a checklist to run on your own diff: [PERFORMANCE-REVIEW-CHECKLIST.md](references/PERFORMANCE-REVIEW-CHECKLIST.md).

## Core rules

1. Server-load data. Await only what SEO, LCP, layout or the HTTP status needs; return promises for the rest (see `storefront-next:sfnext-data-fetching`).
2. One `<Suspense>` per async operation, with a skeleton that reserves the final size. No `fallback={null}` above the fold unless space is reserved.
3. Promise identity must be stable across renders: compose in the loader, read from `loaderData`/props, never `Promise.all`/`.then`/`new Promise` in render, never `useMemo` around a promise. Escape hatches: `useState(() => ...)` pinning or `useRef` re-pinning.
4. Every `use()`/`<Await>` consumer needs a `<Suspense>` ancestor; otherwise it blocks the first byte of the streamed shell.
5. Heavy or hidden UI (modals, drawers, dialogs, rich editors) is `React.lazy` and mounted only while needed.
6. Shape data in the loader, not in render.
7. Hints and third-party scripts cost: preconnect only to origins used on every page; load scripts `async`/`defer`.

## Lazy modals and drawers

```tsx
import { lazy, Suspense, useState } from 'react';
import { useDeferredUnmount } from '@/hooks/use-deferred-unmount';

const SizeGuide = lazy(() => import('@/components/size-guide').then((m) => ({ default: m.SizeGuide })));

export function SizeGuideButton() {
    const [open, setOpen] = useState(false);
    const mounted = useDeferredUnmount(open); // stays mounted briefly after close for the exit animation
    return (
        <>
            <button onClick={() => setOpen(true)}>Size guide</button>
            {mounted && (
                <Suspense fallback={null}>
                    <SizeGuide open={open} onOpenChange={setOpen} />
                </Suspense>
            )}
        </>
    );
}
```

Avoid a sticky "loaded" latch (a state that flips true on first open and never resets): fetchers inside the modal stay registered and re-run on every later revalidation. See `src/components/product-tile/quick-add-button.tsx`.

## Deferred rendering

`useDeferredRender(enabled, options)` (`@/hooks/use-deferred-render`) delays mounting a Suspense boundary until an idle frame; use it for large below-the-fold grids. `DeferredProductGrid` (`@/components/product-grid/deferred`) is the reference. `useDeferredRenderSequence(n)` fans out work one step per idle frame.

## Page Designer

Mark a region `<Region critical>` only when it is required for the initial HTML or is an LCP candidate, and `await` that page in the loader (omit a region fallback). Below-the-fold regions stay streamed. See `storefront-next:sfnext-page-designer`.

## Images, fonts, hints

- Images: use `DynamicImage` (`@/components/dynamic-image`). Props: `src`, `alt`, `widths`, `heights`, `imageProps`, `as`, `className`, `loading`, `priority`, `objectFit`. Give the LCP image `priority="high"` (React 19 preload) and never lazy-load it. Provide `widths` matching the layout, or wrap a group in `DynamicImageProvider` (`@/providers/dynamic-image`, `value={{ widths }}`). URL helpers are in `docs/README-IMAGES.md`.
- Fonts: the template self-hosts `public/fonts/sen-variable.woff2`, preloads it in `src/root.tsx` `links`, and declares `@font-face` with `font-display: swap` in `src/theme/base.css`. Keep fonts same-origin, preload only the one above-the-fold face, and consider system fonts for secondary text.
- Resource hints: configure `app.links.preconnect`, `prefetchDns`, `prefetch` in `config.server.ts` or via `PUBLIC__app__links__preconnect='["https://cdn.example.com"]'`. Default preconnects to the image host only.

## Measure

| Task | Command |
|---|---|
| Check bundle size limits (block CI) | `pnpm bundlesize` |
| Interactive treemaps (`build/client-bundle-size.html`, `build/ssr-bundle-size.html`) | `cross-env BUNDLES_SIZE_ANALYZE=true pnpm build` |
| Compare size runs | `pnpm bundlesize:compare` |
| Lighthouse | `pnpm lighthouse:ci` |
| Request timings | `performance.metrics` flags in `config.server.ts` |

The limits live in the `bundlesize` block of `package.json`. If a legitimate change exceeds a limit, state the reason and raise it deliberately; do not use `manualChunks` to bucket components.

`performance.metrics` (`serverPerformanceMetricsEnabled`, `serverTimingHeaderEnabled`, `clientPerformanceMetricsEnabled`) are all `false` in the shipped `config.server.ts`; `docs/README-PERFORMANCE-METRICS.md` lists two of them as defaulting to `true`, but the shipped config wins. Enable them only while debugging, because `serverTimingHeaderEnabled` adds a `Server-Timing` header and costs response time. Override via `PUBLIC__app__...` environment variables (`storefront-next:sfnext-configuration`).

## Review workflow

1. Run the checklist on your diff (fetch topology, Suspense, promise stability, hydration, revalidation scope, client transforms).
2. `pnpm typecheck`, `pnpm lint`, `pnpm test`.
3. `pnpm bundlesize` when you add dependencies or routes.
4. Load the page with network throttling and CPU slowdown; confirm no layout shift when streamed sections resolve and that server HTML contains the LCP element.

Impact rule of thumb: traffic of the page x number of instances on it x cost per instance. A fetch in a product tile is multiplied by every tile.

## References

- [PERFORMANCE-REVIEW-CHECKLIST.md](references/PERFORMANCE-REVIEW-CHECKLIST.md) - self-review checklist with rules, bad/good forms and exceptions
- [SUSPENSE-AND-STREAMING.md](references/SUSPENSE-AND-STREAMING.md) - placement, granularity, promise stability recipes

## Finding more

`AGENTS.md` "Key Documentation" and `docs/README-PERFORMANCE.md`. `b2c docs search "storefront next performance"` or `docs_search` MCP tool.

## Related Skills

- `storefront-next:sfnext-data-fetching` - loaders, streaming
- `storefront-next:sfnext-revalidation` - cutting wasted loader re-runs
- `storefront-next:sfnext-state-management` - render scope and stores
- `storefront-next:sfnext-components` - component conventions
- `storefront-next:sfnext-page-designer` - critical regions
- `storefront-next:sfnext-quality-gates` - lint, typecheck, tests before merge
- `storefront-next:sfnext-deployment` - bundle and MRT limits
- `b2c-cli:b2c-mrt` - Managed Runtime logs and deploys
