---
name: sfnext-data-fetching
description: >-
  Load and mutate data in a Storefront Next project: route loaders that call SCAPI through createApiClients from @/lib/api-clients.server, critical versus streamed (deferred) data, createBasketAction and BasketAction for cart actions, createActionError and ErrorCode, data() responses, useFetcher and the useScapiFetcher hook with its server allowlist, request-scoped dedupe and MRT timeouts, non-personalized SCAPI responses, shopper context, and custom API clients. Use for "fetch products in a loader", "stream data", "add a cart action", "call SCAPI from a component", "resource route", "NormalizedApiError", or "loader blocks the page". Do not use for route files or links (use `storefront-next:sfnext-routing`), when loaders re-run after actions (use `storefront-next:sfnext-revalidation`), Suspense/LCP tuning (use `storefront-next:sfnext-performance`), or defining SCAPI custom APIs (use `storefront-next:sfnext-scapi`).
---

# Storefront Next Data Fetching

All data comes from the server. Loaders and actions run on the server with the shopper's session; the browser never calls SCAPI directly. Your project ships `docs/README-DATA.md`, `docs/README-SUSPENSE.md`, `docs/README-SCAPI-NON-PERSONALIZED-RESPONSES.md` and `docs/README-SHOPPER-CONTEXT.md`, plus the "Performance & Data Rules" in `AGENTS.md`; this skill is the quick path, those are authoritative.

## The rules (same as AGENTS.md)

1. Fetch on the server in `loader` (reads) and `action` (writes). There is no `clientLoader` or `clientAction`.
2. Classify every piece of data:
   - **Critical** (needed for SEO, LCP, layout stability or the HTTP status): `await` it in the loader.
   - **Non-critical** (below the fold, recommendations, reviews, secondary panels): start the request, do not await it, and return the unresolved promise so it streams.
   - **Interaction-driven** (only after a click, hover or input): fetch on demand with a fetcher.
3. Never block a loader on non-critical data.
4. Pass the promise through `loaderData` and read it under its own `<Suspense>` with `use()` or `<Await>`. Keep the promise identity stable (compose it in the loader, never `Promise.all` or `.then` in render).
5. Export `shouldRevalidate` on routes whose loaders depend on URL filters (see `storefront-next:sfnext-revalidation`).

## Loader with critical and streamed data

```tsx
import { Suspense } from 'react';
import { Await } from 'react-router';
import type { Route } from './+types/_app.example';
import { createApiClients } from '@/lib/api-clients.server';
import { fetchProductById } from '@/lib/api/products.server';
import { NormalizedApiError } from '@/lib/api/normalized-api-error';

export async function loader({ context, params }: Route.LoaderArgs) {
    const clients = createApiClients(context);

    // Non-critical: start now, do not await.
    const related = clients.shopperSearch
        .productSearch({ params: { query: { q: 'shirt', limit: 8 } } })
        .then(({ data }) => data.hits ?? []);

    // Critical: needed for status, SEO and LCP.
    try {
        const product = await fetchProductById(context, params.id ?? '', { expand: ['images', 'prices'] });
        if (!product) throw new Response('Not found', { status: 404 });
        return { product, related };
    } catch (e) {
        if (e instanceof NormalizedApiError && e.status) throw new Response(e.message, { status: e.status });
        throw e;
    }
}

export default function Example({ loaderData }: Route.ComponentProps) {
    return (
        <>
            <h1>{loaderData.product.name}</h1>
            <Suspense fallback={<div className="h-40" aria-busy="true" />}>
                <Await resolve={loaderData.related}>{(hits) => <ul>{hits.map((h) => <li key={h.productId}>{h.productName}</li>)}</ul>}</Await>
            </Suspense>
        </>
    );
}
```

Real precedent: `src/routes/_app.p.$.tsx` awaits the product (404 becomes `throw new Response(..., { status: 404 })`) and streams the Page Designer page, schema and extras; `src/components/product-grid/deferred.tsx` is the streamed-grid pattern.

## SCAPI clients

`createApiClients(context)` from `@/lib/api-clients.server` returns `AppClients`: every generated Shopper API client (`shopperProducts`, `shopperSearch`, `shopperBasketsV2`, `shopperCustomers`, `shopperOrders`, `shopperLogin`, and more) plus generated clients for your custom APIs (`@/scapi/custom-clients`). Call shape:

```ts
const { data } = await clients.shopperBasketsV2.addItemToBasket({
    params: { path: { basketId }, query: {} },
    body: [{ productId, quantity: 1 }],   // body is a sibling of params; this endpoint takes an array
});
```

Results are `{ data }`; failures throw. Prefer the thin wrappers in `src/lib/api/*.server.ts` (`fetchProductById`, `fetchProductsByIds` which chunks to the 24-id limit, category, search, order, customer and basket helpers): they log and rethrow as `NormalizedApiError` (`@/lib/api/normalized-api-error`, with `.status` and `.cause`). Add new wrappers there rather than calling clients inline in many routes.

The clients already wrap `fetch` with request-scoped GET/HEAD dedupe (identical calls in one request share one response; any mutation clears the cache), a hard timeout from the `MRT_REQUEST_TIMEOUT` environment variable when set, and a health observer that logs 429 and load-status headers. Do not re-implement them. More: [API-CLIENTS.md](references/API-CLIENTS.md).

Trim payloads: pass only the `expand`/`select` values you render. Availability is cached about 60 seconds and prices/promotions about 15 minutes, so short-TTL data is a good candidate for streaming. Shopper-agnostic responses can be cached using the policy in `src/lib/scapi/non-personalized-response-policy.server.ts` (see the shipped README-SCAPI-NON-PERSONALIZED-RESPONSES); request `personalized: 'none'` only where the response truly is the same for all shoppers, as the navigation loader in `_app.tsx` does.

## Mutations: actions

Prefer an `action.*` route and a `<Form>` (navigating) or `useFetcher` (non-navigating).

Basket mutations use the factory, which loads the basket, parses `FormData`, catches errors and wraps the result:

```ts
// src/routes/action.example-remove-item.ts
import { data } from 'react-router';
import { BasketAction, createBasketAction } from '@/lib/cart/basket-action.server';
import { createActionError } from '@/lib/action-error-helpers.server';
import { ErrorCode } from '@/lib/error-codes';

export const action = createBasketAction(
    { method: 'POST', action: BasketAction.CartItemRemove, parse: (fd) => ({ itemId: String(fd.get('itemId') ?? '') }) },
    async ({ input, basketId, clients }) => {
        if (!input.itemId) {
            return data({ success: false, error: createActionError({ code: ErrorCode.REQUIRED_FIELD, message: 'itemId is required' }) }, { status: 400 });
        }
        const { data: basket } = await clients.shopperBasketsV2.removeItemFromBasket({ params: { path: { basketId, itemId: input.itemId } } });
        return basket; // factory returns { success: true, basket } and syncs the basket resource
    }
);
```

Return the updated `Basket` for success. Return `data(payload, { status })` for validation errors (use `data()` from `react-router`, not `Response.json`). Thrown SCAPI 4xx errors pass their status through; others become 500. Available `BasketAction` values are listed in `src/lib/cart/basket-action.server.ts`. See the existing `action.cart-item-*.tsx` files. Details and non-basket actions: [ACTIONS.md](references/ACTIONS.md).

## Fetching from components

- Use `useFetcher` against your own `action.*`/`resource.*` routes (`resourceRoutes` in `@/route-paths`).
- Use `useScapiFetcher(client, method, { params, body })` from `@/hooks/use-scapi-fetcher` for a small allowlisted set of Shopper calls without writing a route. It returns `.load()`, `.submit(payload)`, `.data`, `.errors`, `.success`. The server enforces an allowlist in `src/lib/scapi/resource-policy.ts` (for example `shopperProducts.getProduct`, `shopperBasketsV2.getBasket`, `shopperSearch.getSearchSuggestions`, and selected `shopperCustomers` address and profile mutations). Anything else needs a dedicated route. See [SCAPI-FETCHER.md](references/SCAPI-FETCHER.md).
- Do not fetch in `useEffect` on mount what the loader could fetch (see the performance review checklist in `storefront-next:sfnext-performance`).
- Fetchers and raw `fetch` calls that do not go through a submission do not trigger revalidation; actions do, for every active loader.

## Checklist

1. Can the loader fetch this at request time? If yes, do it there.
2. Is it critical? `await`; otherwise return the promise with its own Suspense and a sized skeleton.
3. Did you request only the fields you render?
4. Mutation errors: `createActionError` with an `ErrorCode`, return with `data(..., { status })`.
5. New shared fetch logic goes in `src/lib/api/*.server.ts` with a test (`storefront-next:sfnext-testing`).
6. Run `pnpm typecheck` and `pnpm test`.

Deeper: [LOADERS.md](references/LOADERS.md).

## Finding more

Open `AGENTS.md` ("Key Documentation") and `docs/README-DATA.md` in your project. Search product docs with `b2c docs search "<term>"` or the `docs_search` MCP tool.

## Related Skills

- `storefront-next:sfnext-routing` - route files and links
- `storefront-next:sfnext-revalidation` - avoid wasted loader re-runs after actions
- `storefront-next:sfnext-performance` - Suspense placement, LCP, review checklist
- `storefront-next:sfnext-state-management` - basket provider and client state
- `storefront-next:sfnext-scapi` - SCAPI access and custom APIs
- `storefront-next:sfnext-authentication` - sessions behind loaders
- `b2c-cli:b2c-scapi-custom` - inspect custom API endpoints
- `b2c:b2c-custom-api-development` - build a custom API
