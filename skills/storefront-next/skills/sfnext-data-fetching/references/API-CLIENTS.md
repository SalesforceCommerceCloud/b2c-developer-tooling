# API clients

`createApiClients(context)` (`@/lib/api-clients.server`) builds, per request, the typed clients used in loaders and actions. Cost is low; call it in each function that needs it.

## What you get

`AppClients` (type in `@/scapi/custom-clients`) is the generated Shopper API clients merged with clients generated for your custom APIs. Authentication (shopper access token), `siteId`, locale and currency come from the request context. The `@/scapi` barrel exports schema and operation types, for example `ShopperProducts.schemas['Product']` and `ApiError`.

## Fetch layers

Each client uses `dedupe(timeout(healthObserver(originBoundFetch)))`:

| Layer | Behavior |
|---|---|
| dedupe | within one request, identical GET/HEAD calls share one promise; any non-GET call clears the whole registry |
| timeout | aborts calls after `MRT_REQUEST_TIMEOUT` ms when that variable is set (no-op otherwise) |
| health observer | logs 429 and SCAPI load-status signals |

Consequences: it is safe for several components' loaders to request the same product; do not add your own in-memory cache keyed by request; after a write in the same request, re-reads are real calls.

## Errors

Clients throw. In `src/lib/api/*.server.ts`, catch and `throw new NormalizedApiError(error)`; route code checks `e.status`. Map 404 to a `Response` with status 404; let unexpected errors reach the route `ErrorBoundary`.

## Custom APIs

Generated custom-API clients appear on `AppClients` (for example a notification client). To add one: define the API with `storefront-next:sfnext-scapi` guidance, generate the client as described there, and call it as `clients.<name>.<operation>({ params, body })`.

## Request shaping checklist

- `expand`/`select` only what the UI renders.
- `fetchProductsByIds` chunks at 24 ids; do not loop single `getProduct` calls.
- Start independent calls before awaiting (parallel), but keep non-critical calls un-awaited.
- Pass `personalized: 'none'` only for shopper-independent data, following `docs/README-SCAPI-NON-PERSONALIZED-RESPONSES.md`.
