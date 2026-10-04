# Actions and errors

## Where to put a mutation

Create `src/routes/action.<name>.ts(x)` exporting only `action`. Add an entry to `resourceRoutes` in `src/route-paths.ts`. The `/action/**` paths are excluded from the site prefix. Use `<Form method="post" action={resourceRoutes.x}>` when the user should navigate or when a native form must work without JavaScript; use `useFetcher` for in-place changes (add to cart, quantity changes, toggles).

## Basket actions: `createBasketAction`

`import { BasketAction, createBasketAction } from '@/lib/cart/basket-action.server'`

```ts
createBasketAction(
    { method: 'POST' | 'PATCH', action: BasketAction.X, parse: (fd: FormData) => input },
    async ({ input, basketId, basket, context, clients, logger }) => Basket | ReturnType<typeof data>
)
```

- The factory enforces the HTTP method, ensures a basket exists, parses form data, runs the handler and converts the result.
- Returning a `Basket` yields `{ success: true, basket }` (status 200) and updates the basket resource through `updateBasketResource` so the provider picks it up.
- Returning `data({ success: false, error }, { status })` sends validation errors.
- Throwing yields `{ success: false, error }`; a SCAPI 4xx keeps its status, anything else is 500.
- Enum values: CartItemRemove, CartItemUpdate, CartItemAdd, CartSetAdd, CartBundleAdd, CartBundleUpdate, PromoCodeAdd, PromoCodeRemove, BonusProductAdd, SwatchOrder. Add new ones in the same file when a new kind of basket mutation needs its own name.
- Request bodies for some calls are arrays (`addItemToBasket` takes `[payload]`).

Read `action.cart-item-add.tsx`, `action.cart-item-update.tsx` and `action.cart-item-remove.tsx` for complete examples.

## Other actions

For non-basket work (customer, wishlist, consent, checkout), write a plain `action({ request, context })`: read `await request.formData()`, call `createApiClients(context)` or a `src/lib/api/*.server.ts` wrapper, and return `data(...)`. Check authentication with `getAuth(context)` where needed (`NOT_AUTHENTICATED`).

## Error shape

```ts
import { createActionError } from '@/lib/action-error-helpers.server';
import { ErrorCode } from '@/lib/error-codes';

createActionError({ code: ErrorCode.INVALID_INPUT, message: 'Invalid quantity' });
createActionError({ error: caughtError });            // normalizes SCAPI/unknown errors
```

`ErrorCode` members: NOT_FOUND, NOT_AUTHENTICATED, NOT_AUTHORIZED, INVALID_INPUT, REQUIRED_FIELD, CONFLICT, EXPIRED, OPERATION_FAILED, OUT_OF_STOCK, RATE_LIMITED, METHOD_NOT_ALLOWED, UNKNOWN, SCAPI_UNSUPPORTED, CONFIGURATION_ERROR.

Response types live in `@/routes/types/action-responses` (`ActionResponse<T>`, `BasketActionResponse`). Return status codes with `data(payload, { status })` from `react-router`.

## Client side

- `useItemFetcher({ itemId, componentName })` (`@/hooks/use-item-fetcher`) gives per-line-item fetcher keys so a row shows its own pending state.
- Optimistic UI: read `fetcher.formData`, `useNavigation`, or `useOptimistic`.
- Side effects after a fetcher finishes: `useFetcherEffect` (`@/hooks/use-fetcher-effect`) or `useScapiFetcherEffect` (`@/hooks/use-scapi-fetcher-effect`) instead of hand-written `useEffect` chains.

## After an action

React Router revalidates every active loader by default. Decide which should re-run and declare it with `shouldRevalidate` or tags: `storefront-next:sfnext-revalidation`.
