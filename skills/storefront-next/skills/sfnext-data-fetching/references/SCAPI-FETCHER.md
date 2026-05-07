# SCAPI Fetcher Reference

## How useScapiFetcher Works

```
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

Even though `useScapiFetcher` is called from the browser, the actual SCAPI requests happen **on the server** through the resource route, keeping credentials secure.

## API

```typescript
const fetcher = useScapiFetcher(
    clientName,    // SCAPI client: 'shopperSearch', 'shopperProducts', etc.
    methodName,    // Method: 'getSearchSuggestions', 'productSearch', etc.
    parameters     // SCAPI parameters object
);

// Properties
fetcher.data       // Response data (undefined until loaded)
fetcher.state      // 'idle' | 'loading' | 'submitting'
fetcher.load()     // Trigger a GET request
fetcher.submit()   // Trigger a POST request
```

## loader vs useScapiFetcher

| Scenario | Use |
|----------|-----|
| Load product data on page visit | `loader` |
| Load checkout data | `loader` |
| Search suggestions as user types | `useScapiFetcher` |
| Update customer profile in modal | `useScapiFetcher` |
| Load recommendations after page loads | `useScapiFetcher` |
| Fetch bonus products when modal opens | `useScapiFetcher` |
| Infinite scroll / Load more | `useScapiFetcher` |

## Timeline Comparison

```
loader (Server):
  [navigate] → [server fetch] → [stream to client]
  Data available: Streamed during render via Suspense

useScapiFetcher:
  [render] → [user action] → [fetch] → [re-render]
  Data available: AFTER user action, component re-renders
```

## Complete Example: Search Suggestions

```typescript
import { useScapiFetcher } from '@/hooks/use-scapi-fetcher';
import { useMemo, useCallback } from 'react';

export function useSearchSuggestions({ q, limit, currency }) {
    const parameters = useMemo(
        () => ({
            params: {
                query: { q, limit, currency }
            }
        }),
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
        refetch
    };
}
```
