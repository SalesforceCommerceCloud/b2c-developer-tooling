---
name: sfnext-state-management
description: >-
  Choose the right state mechanism in a Storefront Next project: loader and action data, useRouteLoaderData, URL state with useSearchParams, cookies and sessions, optimistic UI (fetcher.formData, useNavigation, useOptimistic), React context providers (BasketProvider, AuthProvider, wishlist, product-context), and small useSyncExternalStore stores such as the mini-cart store. Use for "where should this state live", "useBasket", "useAuth", "share state between components", "optimistic add to cart", "global client state", "hydration mismatch from a store", or "do I need Zustand". Do not use for fetching or mutating data (use `storefront-next:sfnext-data-fetching`), controlling loader re-runs (use `storefront-next:sfnext-revalidation`), or login flows and sessions (use `storefront-next:sfnext-authentication`).
---

# Storefront Next State Management

Server state lives in loaders and actions. Client state is small and local. There is no global client store library in the template (Zustand was removed): use the tools below in this order. `docs/README-STATE.md` and `docs/README-DATA.md` in your project cover each in depth.

## Decision table

| State | Use |
|---|---|
| Data from SCAPI | `loader` + `loaderData`; `action` for writes |
| Another route's loader data | `useRouteLoaderData('routes/_app')` (route id = file path without extension) |
| Filters, sort, pagination, tab | URL: `useSearchParams` / `useParams` (shareable, SSR-friendly) |
| Must survive requests, read by server | cookies (`createCookie` from `@/lib/cookie-utils.server`) or session helpers |
| Pending or optimistic result | `fetcher.formData`, `useNavigation`, `useOptimistic` |
| Form fields, toggles, open/close in one component | `useState` / `useReducer` |
| Shared by a subtree | React context with a provider at the owning layout |
| Shared app-wide and read outside React, or high-frequency | module-level `useSyncExternalStore` store |
| Request-scoped server values (site, auth, basket) | router `context` (middleware), read with `context.get(...)` |

Prefer the earliest row that works. Never copy loader data into `useState` to "cache" it.

## Existing providers and stores

| Need | API |
|---|---|
| Basket | `BasketProvider` in `src/providers/basket.tsx`: `useBasket({ autoLoad })`, `useBasketSnapshot`, `useBasketHydrated`, `useBasketError`, `useBasketUpdater`, `useBasketReset`, `useBasketLoader`, `useBasketReconcile`; `BasketCookieReconciler` syncs the cookie |
| Session info | `useAuth()` from `@/providers/auth` |
| Product / variant selection | `@/providers/product-context`, `@/providers/product-view` |
| Image widths | `DynamicImageProvider` (`@/providers/dynamic-image`) |
| Wishlist | `src/providers/wishlist.ts` (module-level store) |
| Mini-cart open state | `useMiniCartStore`, `setMiniCartOpen` in `src/hooks/mini-cart-store.ts` |
| Cart toast | `src/hooks/cart-mutation-toast-store.ts` |
| Shopper context | `useShopperContext` (`@/hooks/use-shopper-context`) |

The basket is loaded through `useScapiFetcher('shopperBasketsV2', 'getBasket')` and is updated from action results via `updateBasketResource` (server side, `@/middlewares/basket.server`), so after a basket action components simply re-render from `useBasket()`. The `__sfdc_basket` cookie carries the basket id; `__sfdc_usertype` is the user-type hint. Do not read these directly in components; use the hooks. Server reads: `getBasket`, `getBasketSnapshot`, `ensureBasketId`, `destroyBasket`, and `getAuth`, `updateAuth`, `destroyAuth` from `@/middlewares/auth.server`.

## Optimistic UI

```tsx
const fetcher = useFetcher<typeof action>();
const removing = fetcher.formData?.get('itemId') === item.itemId;
return <li hidden={removing}>...</li>;
```

Use `useOptimistic` for values the server will confirm, and `useNavigation` for URL-driven pending states. Roll back by reading the confirmed `loaderData`/basket value; never hand-maintain a parallel copy.

## A small external store

Use when state is global, changes often, or must be set outside React. Follow `src/hooks/mini-cart-store.ts`:

```ts
import { useSyncExternalStore } from 'react';

interface State { open: boolean }
let state: State = { open: false };
const SERVER_STATE: State = Object.freeze({ open: false });
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => { listeners.add(l); return () => void listeners.delete(l); };
export const setOpen = (open: boolean) => {
    if (open === state.open) return;         // skip no-op writes
    state = { ...state, open };
    listeners.forEach((l) => l());
};
export function useDrawerStore<T>(select: (s: State) => T): T {
    return useSyncExternalStore(subscribe, () => select(state), () => select(SERVER_STATE));
}
```

Rules:

- `getSnapshot` must return a referentially stable value when nothing changed. Select primitives; a selector that allocates per call loops forever.
- Provide a server snapshot and mutate only from events or effects so SSR and the first client render match (no hydration warnings).
- Split stores by independent writers so each consumer subscribes to a slice.
- For an instance-based store (one per widget), create it in a factory and provide it by context, as `createStoreLocatorStore` does in the store-locator extension.

## Context providers

- Put the provider at the lowest layout that contains all consumers.
- Memoize the `value` (`useMemo`, `useCallback`) and split read-only state from updaters into separate contexts so updater-only consumers do not re-render.
- Use a selector pattern for large contexts (see README-STATE "Context Selector Pattern").
- Values used only inside callbacks belong in `useRef`, not context state.
- Compose providers with `src/providers/compose-providers.tsx`.

More patterns and anti-patterns in [PATTERNS.md](references/PATTERNS.md).

## Common mistakes

| Mistake | Instead |
|---|---|
| `useEffect` that fetches on mount and stores in state | loader (or streamed promise) |
| Copying `loaderData` or basket into `useState` | read directly; derive with plain expressions |
| Filters in `useState` | `useSearchParams` |
| Reading cookies in components | loader returns the value, or use the provider hook |
| New context for one component's state | `useState` in that component |
| Adding Zustand or Redux | the mechanisms above; check `storefront-next:sfnext-overview` for conventions |

## Finding more

`AGENTS.md` ("Key Documentation"), `docs/README-STATE.md`, `docs/README-DATA.md`. `b2c docs search "storefront next state"` or the `docs_search` MCP tool.

## Related Skills

- `storefront-next:sfnext-data-fetching` - loaders, actions, fetchers
- `storefront-next:sfnext-revalidation` - when providers make a re-run unnecessary
- `storefront-next:sfnext-performance` - hydration stability and render scope
- `storefront-next:sfnext-authentication` - `useAuth` and session lifecycle
- `storefront-next:sfnext-commerce-features` - cart, wishlist, checkout features
- `storefront-next:sfnext-components` - component conventions
