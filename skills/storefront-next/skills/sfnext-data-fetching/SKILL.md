---
name: sfnext-data-fetching
description: Implement server-side data fetching in Storefront Next using loaders, actions, and useScapiFetcher. Use when writing loader functions, making SCAPI calls, handling form submissions, or implementing interactive data fetching. Covers synchronous loaders, streaming patterns, createApiClients, and parallel requests. NOT for client-side Zustand state — see sfnext-state-management.
---

# Data Fetching Skill

This skill covers server-side data fetching patterns in Storefront Next — loaders, actions, and the useScapiFetcher hook.

## Overview

Storefront Next mandates **server-only data loading**. All SCAPI requests execute on the MRT server, never in the browser. Three mechanisms exist:

| Mechanism | When It Runs | Use Case |
|-----------|-------------|----------|
| `loader` | Route navigation | Initial page data |
| `action` | Form submission | Mutations (add to cart, update profile) |
| `useScapiFetcher` | User interaction | On-demand fetching (search suggestions, infinite scroll) |

## Loader Patterns

Loaders can be **synchronous** (returning promises for streaming) or **async** (awaiting critical data). Choose based on what the page needs:

- **Sync loader** — Returns promises directly. Enables streaming SSR: the shell renders immediately while data streams in. Best when all data can render progressively.
- **Async loader** — Awaits critical data before rendering. Use when data is required for SEO or the page shell (e.g., category name in breadcrumbs). Non-critical data can still be returned as promises for streaming.

```typescript
// Sync — full streaming (all data renders progressively)
export function loader({ params, context }: LoaderFunctionArgs): ProductPageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),
        reviews: clients.shopperProducts.getReviews({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),
    };
}

// Async — await critical data, stream the rest (mixed strategy)
export async function loader({ params, context }: LoaderFunctionArgs): Promise<CategoryPageData> {
    const clients = createApiClients(context);

    // Await critical data needed for page shell/SEO
    const category = await clients.shopperProducts.getCategory({
        params: { path: { id: params.categoryId } }
    }).then(({ data }) => data);

    return {
        category,  // Resolved immediately
        products: clients.shopperSearch.productSearch({
            params: { query: { q: '', refine: { cgid: params.categoryId } } }
        }).then(({ data }) => data),  // Streamed
    };
}
```

## When to Use Each Pattern

| Pattern | When | Example |
|---------|------|---------|
| Sync (full streaming) | All data can render progressively | Product page with reviews |
| Async (await critical) | SEO-critical data needed for page shell | Category page (needs category name) |
| Mixed | Some data critical, some deferrable | Category name (await) + product grid (stream) |

See [Loader Patterns Reference](references/LOADER-PATTERNS.md) for more patterns and data flow diagrams.

## Action Functions

Handle mutations (form submissions, cart updates):

```typescript
import { data, redirect } from 'react-router';

export async function action({ request, context }: ActionFunctionArgs) {
    const formData = await request.formData();
    const productId = formData.get('productId') as string;

    const clients = createApiClients(context);

    try {
        await clients.shopperBasketsV2.addItemToBasket({
            params: {
                path: { basketId },
                body: { productId, quantity: 1 },
            },
        });
        return data({ success: true });
    } catch (error) {
        return data({ success: false, error: error.message }, { status: 400 });
    }
}
```

## useScapiFetcher — Interactive Data Fetching

For on-demand data fetching triggered by user interactions (after page load):

```typescript
import { useScapiFetcher } from '@/hooks/use-scapi-fetcher';

export function useSearchSuggestions({ q, limit, currency }) {
    const parameters = useMemo(
        () => ({ params: { query: { q, limit, currency } } }),
        [q, limit, currency]
    );

    const fetcher = useScapiFetcher(
        'shopperSearch',
        'getSearchSuggestions',
        parameters
    );

    const refetch = useCallback(async () => {
        await fetcher.load();
    }, [fetcher]);

    return {
        data: fetcher.data,
        isLoading: fetcher.state === 'loading',
        refetch,
    };
}
```

See [SCAPI Fetcher Reference](references/SCAPI-FETCHER.md) for the complete useScapiFetcher API.

## API Client Usage

Always use `createApiClients(context)` in loaders and actions:

```typescript
import { createApiClients } from '@/lib/api-clients';

export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);

    clients.shopperProducts.getProduct({...});
    clients.shopperCustomers.getCustomer({...});
    clients.shopperBasketsV2.getBasket({...});
    clients.shopperSearch.productSearch({...});
    clients.shopperOrders.getOrder({...});
}
```

## Parallel vs Sequential Requests

```typescript
// GOOD — Parallel requests (all start simultaneously)
export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}).then(({ data }) => data),
        reviews: clients.shopperProducts.getReviews({...}).then(({ data }) => data),
        recommendations: clients.shopperProducts.getRecommendations({...}).then(({ data }) => data),
    };
}

// AVOID — Sequential awaits of independent requests (unnecessarily slow)
export async function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    const product = await clients.shopperProducts.getProduct({...});  // Waits...
    const reviews = await clients.shopperProducts.getReviews({...});  // Then waits again
    return { product, reviews };
}
```

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Awaiting all data | Blocks page transition unnecessarily | Only await SEO-critical data; stream the rest |
| Client loaders | Not permitted in Storefront Next | Use server `loader` or `useScapiFetcher` |
| Sequential `await` | Slow data loading | Return promises in parallel |
| Missing `context` in `getConfig()` | Config unavailable | Pass `context` in server loaders: `getConfig(context)` |

## Related Skills

- `storefront-next:sfnext-routing` - Route file conventions and module exports
- `storefront-next:sfnext-components` - Rendering loader data with createPage and Suspense
- `storefront-next:sfnext-state-management` - Client-side Zustand stores (NOT data fetching)
- `storefront-next:sfnext-authentication` - Auth context in loaders

## Reference Documentation

- [Loader Patterns Reference](references/LOADER-PATTERNS.md) - Data flow diagrams and advanced patterns
- [SCAPI Fetcher Reference](references/SCAPI-FETCHER.md) - Complete useScapiFetcher API and examples
