# Data Fetching Patterns

## Loader Functions

**IMPORTANT**: This project **mandates server-only data loading**. Every UI route must only export a `loader` function.

### Critical Rule: Synchronous Loaders for Streaming

**IMPORTANT**: Loaders should be **synchronous functions that return objects containing promises**, NOT async functions. This enables non-blocking page transitions and streaming SSR.

```typescript
// ✅ CORRECT - Synchronous loader returning promises
export function loader({ context }: LoaderFunctionArgs): ProductPageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),  // Promise - streams
        reviews: clients.shopperProducts.getReviews({...}),  // Promise - streams
    };
}

// ❌ AVOID - Async loader blocks page transitions
export async function loader({ context }: LoaderFunctionArgs): Promise<ProductPageData> {
    const product = await clients.shopperProducts.getProduct({...}); // Blocks!
    return { product };
}
```

**Why this matters:**
- Async loaders with `await` **block the entire page transition** until all data resolves
- Synchronous loaders returning promises allow React to **stream data progressively**
- Each promise resolves independently, enabling granular Suspense boundaries
- Users see content as it becomes available, not all at once

**Behavior**:
- Initial load: Runs on server (SSR)
- Navigation: Runs on server (XHR/fetch to server)
- SCAPI requests always on MRT

## Data Loading Strategies

### Pattern 1: Awaited Data (Blocking)

```typescript
// ⚠️ BLOCKS rendering until all data is ready
export async function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: await clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data)
    };
}
```

**Use when:** Critical data must be available before rendering (SEO, above-the-fold content)

### Pattern 2: Deferred Data (Streaming)

```typescript
// ✅ RECOMMENDED - Streams data progressively
export function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        // Return promises directly - they'll stream to client
        product: clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),

        reviews: clients.shopperProducts.getReviews({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data)
    };
}
```

**Use when:** Non-critical data can load after initial render

### Pattern 3: Mixed Strategy

```typescript
// ✅ BEST OF BOTH - Critical data awaited, rest streamed
export async function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);

    // Await critical data
    const product = await clients.shopperProducts.getProduct({
        params: { path: { id: params.productId } }
    }).then(({ data }) => data);

    return {
        product, // Resolved
        reviews: clients.shopperProducts.getReviews({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data), // Streamed
        recommendations: clients.shopperProducts.getRecommendations({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data) // Streamed
    };
}
```

## Action Functions

Handle mutations (form submissions, cart updates):

```typescript
import {data, redirect} from 'react-router';

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const productId = formData.get('productId') as string;

  const clients = createApiClients(context);

  try {
    await clients.shopperBasketsV2.addItemToBasket({
      params: {
        path: {basketId},
        body: {productId, quantity: 1},
      },
    });

    return data({success: true});
  } catch (error) {
    return data({success: false, error: error.message}, {status: 400});
  }
}
```

## Interactive Data Fetching: useScapiFetcher

For on-demand, user-triggered data fetching (after page load), use the `useScapiFetcher` hook instead of loaders.

### `loader` vs `useScapiFetcher`

| Aspect | `loader` | `useScapiFetcher` |
|--------|----------|-------------------|
| **When it runs** | Route navigation (page load) | On-demand (user interaction) |
| **Triggered by** | URL change | Component code (useEffect, button click) |
| **Data availability** | Before/during component render (streamed) | After component mounts |
| **Execution context** | Server (MRT) | Triggers server route |
| **Use case** | Initial page data | Dynamic, interactive fetching |

### How `useScapiFetcher` Works

```text
Component calls useScapiFetcher()
        ↓
Hook builds URL: /resource/api/client/{encoded-params}
        ↓
fetcher.load() or fetcher.submit()
        ↓
resource.api.client.$resource.ts loader/action runs ON SERVER
        ↓
createApiClients(context) makes SCAPI call (server-side)
        ↓
JSON response returned to component
```

**Important:** Even though you call `useScapiFetcher` from the browser, the actual SCAPI requests still happen **on the server** through the resource route, keeping credentials secure.

### Example: Search Suggestions

```typescript
import { useScapiFetcher } from '@/hooks/use-scapi-fetcher';
import { useMemo, useCallback } from 'react';

export function useSearchSuggestions({ q, limit, currency }) {
    // Prepare SCAPI parameters
    const parameters = useMemo(
        () => ({
            params: {
                query: { q, limit, currency }
            }
        }),
        [q, limit, currency]
    );

    // Hook automatically routes to server
    const fetcher = useScapiFetcher(
        'shopperSearch',           // SCAPI client
        'getSearchSuggestions',    // Method name
        parameters                 // Parameters
    );

    const refetch = useCallback(async () => {
        await fetcher.load();  // Triggers server request
    }, [fetcher]);

    return {
        data: fetcher.data,
        isLoading: fetcher.state === 'loading',
        refetch
    };
}
```

### When to Use Each Approach

| Scenario | Use |
|----------|-----|
| Load product data when visiting `/product/123` | `loader` |
| Load checkout data | `loader` |
| Search suggestions as user types | `useScapiFetcher` |
| Update customer profile in modal | `useScapiFetcher` |
| Load recommendations after page loads | `useScapiFetcher` |
| Fetch bonus products when modal opens | `useScapiFetcher` |
| Infinite scroll / Load more | `useScapiFetcher` |

### Timeline Comparison

```text
┌─────────────────────────────────────────────────────────────────┐
│                     loader (Server)                             │
├─────────────────────────────────────────────────────────────────┤
│  User clicks link → Server loader() → Stream data → Page render │
│                                                                 │
│  Timeline:  [navigate] → [server fetch] → [stream to client]    │
│                                                                 │
│  Data available: Streamed during render via Suspense            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     useScapiFetcher                             │
├─────────────────────────────────────────────────────────────────┤
│  Page loads → Component mounts → User types → fetcher.load()    │
│                                                                 │
│  Timeline:  [render] → [user action] → [fetch] → [re-render]    │
│                                                                 │
│  Data available: AFTER user action, component re-renders        │
└─────────────────────────────────────────────────────────────────┘
```

## API Client Usage

Always use `createApiClients(context)`:

```typescript
import { createApiClients } from '@/lib/api-clients';

export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);

    // All SCAPI clients with full type safety:
    clients.shopperProducts.getProduct({...});
    clients.shopperCustomers.getCustomer({...});
    clients.shopperBasketsV2.getBasket({...});
    clients.shopperSearch.productSearch({...});
    clients.shopperOrders.getOrder({...});
}
```

## Parallel vs Sequential

```typescript
// ✅ GOOD - Parallel requests
export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);

    return {
        product: clients.shopperProducts.getProduct({...}),
        reviews: clients.shopperProducts.getReviews({...}),
        recommendations: clients.shopperProducts.getRecommendations({...})
    };
    // All three requests start simultaneously
}

// ❌ BAD - Sequential requests
export async function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);

    const product = await clients.shopperProducts.getProduct({...});
    const reviews = await clients.shopperProducts.getReviews({...});
    const recommendations = await clients.shopperProducts.getRecommendations({...});

    return { product, reviews, recommendations };
    // Each request waits for the previous to complete
}
```

## Understanding Data Flow

### Initial Page Load (SSR)

```text
Browser → MRT Server
         ↓
    loader() runs on server
         ↓
    SCAPI requests on MRT
         ↓
    HTML response → Browser
```

**Key characteristics:**
- The `loader()` runs on the server
- SCAPI requests happen server-side (direct in production, proxied in dev)
- Full HTML is returned to browser
- Client hydrates the HTML

### Subsequent Navigation (SPA)

All routes use server `loader` for both SSR and SPA navigation:

```text
User clicks link → React Router intercepts
         ↓
    Browser makes fetch() to server
         ↓
    MRT Server receives request
         ↓
    Same loader() runs on server
         ↓
    SCAPI requests on MRT
         ↓
    JSON response → Browser
         ↓
    React updates DOM
```

**Key Point:** The loader function code is identical for both SSR and SPA navigation. The only difference is the response format (HTML vs JSON). This is why SCAPI credentials stay secure and MRT orchestration works consistently.

**Reference:** See README-DATA.md for complete data fetching documentation.
