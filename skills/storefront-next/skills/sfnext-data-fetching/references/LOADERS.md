# Loader patterns

See also `docs/README-DATA.md`, `docs/README-SUSPENSE.md` and the "Performance & Data Rules" in `AGENTS.md` in your project.

## Critical versus streamed

| Data | Treatment |
|---|---|
| Entity that decides status (product, category, order) | `await`; map SCAPI 404 to `throw new Response(msg, { status: 404 })` |
| Data visible in the first viewport, SEO tags, JSON-LD source | `await` |
| Page Designer page for the LCP region | `await` the page and render `<Region critical>` (see `storefront-next:sfnext-page-designer`) |
| Below the fold, recommendations, reviews, secondary panels | return the promise |
| Short-TTL data (availability about 60 s) that is not the LCP | prefer streaming |
| Needs a user gesture | fetcher, not loader |

Start every independent request before the first `await` so they run in parallel:

```ts
const clients = createApiClients(context);
const extrasPromise = loadExtras(context, id);          // started, not awaited
const product = await fetchProductById(context, id);    // critical
return { product, extras: extrasPromise };
```

## Stable promises

Compose dependent work inside the loader (`extrasPromise.then(...)` there, never in render). A new promise object per render restarts Suspense and flashes the fallback. Do not wrap promises in `useMemo`. If a component must derive one, pin it with `useState(() => ...)` or re-pin via `useRef` keyed on the inputs. Full rules in `docs/README-SUSPENSE.md`.

A streamed promise that can reject needs an error path: use `<Await errorElement={...}>` or make the loader promise resolve to a fallback value (`.catch(() => [])`) when degraded output is acceptable, and log inside the loader.

## Consuming a promise

```tsx
<Suspense fallback={<RecommendationsSkeleton />}>
    <Await resolve={loaderData.recommendations} errorElement={null}>
        {(items) => <Recommendations items={items} />}
    </Await>
</Suspense>
```

- One `<Suspense>` per independent async operation; siblings may resolve independently.
- The skeleton must reserve the final height (no `fallback={null}` above the fold).
- A component that reads a promise with `use()` must have a `<Suspense>` ancestor, otherwise it blocks the first byte.
- For product listings reuse `DeferredProductGrid` (`@/components/product-grid/deferred`).

## Shared layout data

Layout loaders (for example `_app.tsx` navigation) stream their data and child routes read it with `useRouteLoaderData('routes/_app')`. Put data that many routes need in the lowest common layout, not in each page.

## Request context

Loaders receive `context` (`Route.LoaderArgs`). Useful accessors:

| Need | Import |
|---|---|
| Logger | `getLogger` from `@/lib/logger.server` |
| Site, locale, currency | `siteContext` from `@salesforce/storefront-next-runtime/site-context` via `context.get(siteContext)` |
| Config | `getConfig` from `@salesforce/storefront-next-runtime/config` |
| Session | `getAuth` from `@/middlewares/auth.server` |
| Basket | `getBasket`, `getBasketSnapshot`, `ensureBasketId` from `@/middlewares/basket.server` |

Middleware order is defined in `src/root.tsx` (`export const middleware`); add new request-wide state there with `createContext`/middleware instead of re-deriving it in each loader.

## Shopper context and personalization

Shopper context (customer segments, source codes, custom qualifiers) is applied by `shopper-context` middleware and read in components with `useShopperContext`. Read `docs/README-SHOPPER-CONTEXT.md` before changing it. Personalized endpoints must not be cached as shared responses.

## Pitfalls

- `Promise.all([...])` over critical and non-critical together re-blocks the loader; await only the critical set.
- Mutating `loaderData` on the client is unsupported; derive in the loader.
- Do not add `clientLoader`.
- Shaping or normalizing data in render (lookup maps, chained passes) belongs in the loader.
