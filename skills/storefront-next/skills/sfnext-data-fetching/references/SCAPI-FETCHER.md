# `useScapiFetcher`

`import { useScapiFetcher } from '@/hooks/use-scapi-fetcher'`

A typed wrapper over React Router's `useFetcher` that calls a Shopper client method through a single resource route (`src/routes/resource.api.client.$resource.ts`). The request is encoded (base64url of `[client, method, options]`) into `/resource/api/client/:resource`, executed on the server, and the SCAPI `data` is returned unwrapped.

```tsx
const product = useScapiFetcher('shopperProducts', 'getProduct', {
    params: { path: { id: variantId }, query: { expand: ['availability', 'prices'] } },
});

useEffect(() => {
    if (variantId && product.state === 'idle' && !product.data && !product.errors) void product.load();
}, [variantId, product]);  // keep deps stable; see checklist
```

Returned object: `.load()` (GET), `.submit(payload, opts)` (mutation), `.data`, `.errors`, `.success`, plus the fetcher fields such as `.state`.

Real users: `src/providers/basket.tsx` (`shopperBasketsV2.getBasket`) and `src/components/cart-item-modal/*` (`shopperProducts.getProduct`).

## Server allowlist (`src/lib/scapi/resource-policy.ts`)

- Loaders: `shopperBasketsV2.getBasket`, `shopperProducts.getProduct`, `shopperProducts.getProducts`, `shopperSearch.getSearchSuggestions`.
- Actions: `shopperCustomers.createCustomerAddress`, `updateCustomerAddress`, `removeCustomerAddress`, `updateCustomer`, `updateCustomerPassword`.

Everything else is rejected. `organizationId`, `siteId` and `locale` are set by the server, and request bodies and headers are sanitized. The older "helpers" overload is unsupported.

Need something else (recommendations, category products, your own custom API)? Create a `resource.*` route with a `loader`. Pattern: same-origin check, input validation, `Cache-Control: no-store` for personalized output (`resource.recommendations.ts`, `resource.category-products.ts`). To allow another client call, change `resource-policy.ts` deliberately and add a test; do not widen it casually.

## Related hooks

- `useScapiFetcherEffect(fetcher, { onSuccess, onError })` runs callbacks once per completed request.
- `useScapiFetchClient` (`@/hooks/use-scapi-fetch`) is a lower-level, non-fetcher variant for one-off calls.

## When not to use it

If the data is knowable at request time, fetch it in the loader. Mounting a component that fires `useScapiFetcher().load()` in an effect for data the route could have streamed adds a waterfall; see the performance review checklist in `storefront-next:sfnext-performance`.

Calls made through `useScapiFetcher().load()` are fetcher loads, not submissions, so they do not revalidate other loaders. `.submit()` is a submission and does.
