---
name: sfnext-revalidation
description: >-
  Control which Storefront Next loaders re-run after an action or navigation: shouldRevalidate exports, the policy modules in src/lib/revalidation/routes (root, cart, product, category, checkout, home, wishlist, api-client, shared), getActionPath and isAmbientMutation, and the tag primitives in src/lib/revalidation/tags (withRevalidateTags, shouldRevalidateForTags, tagGroup, tagImplications). Use for "page re-fetches after add to cart", "loader runs too often", "stale data after a mutation", "flash of skeleton after changing a swatch", "add shouldRevalidate", or when a new action or route changes which loaders fire. Do not use for writing loaders or actions (use `storefront-next:sfnext-data-fetching`), Suspense and LCP tuning (use `storefront-next:sfnext-performance`), or client-side state (use `storefront-next:sfnext-state-management`).
---

# Storefront Next Revalidation

React Router re-runs loaders after every action submission. A storefront has deep route trees, persistent fetchers (mini-cart) and lazy modals (quick view), so one add-to-cart can re-run many loaders that never read the basket, each with its own SCAPI fan-out. This skill is how to keep only the re-runs that are needed. The authoritative guide is `docs/README-REVALIDATION.md` in your project; read it before changing policy.

## What revalidates

An action submission (`<Form>`, `useSubmit`, `fetcher.submit`) re-runs the whole active set:

1. the matched route chain (root, layouts, leaf),
2. mounted resource fetchers (`fetcher.load()` of a resource route whose component is still mounted),
3. fetchers inside open modals, drawers and sheets.

A raw `fetch()`, a SCAPI client call, or `fetcher.load()` is not a submission and triggers nothing. A route that only exports an `action` fires revalidation but has no loader to re-run.

## When a re-run is justified

For each pair (action, active loader) it is justified only if both are true:

- **Overlap**: the action result changes something the loader reads.
- **Value not already available**: the new value does not already reach the UI another way (for example the basket provider is updated from the action result, so a cart action does not need the PDP loader to re-run).

Two waste types: no overlap, or overlap with the value already available. Do not gate a re-run that is itself the sync mechanism (a provider that refills from loader output).

## Where the policy lives

Each route re-exports a shared policy rather than inlining logic:

```ts
// src/routes/_app.cart.tsx
export { shouldRevalidate } from '@/lib/revalidation/routes/cart';
```

| Module (`src/lib/revalidation/routes/`) | Used by |
|---|---|
| `root.ts` | `src/root.tsx` (`export { shouldRevalidate } from ...`); denylist of irrelevant mutations, safe default is revalidate |
| `cart.ts`, `checkout.ts`, `home.ts`, `wishlist.ts` | the matching route files |
| `product.ts` | `_app.p.$.tsx`: relevant mutations force true; navigation re-runs only on different path or `pid` |
| `category.ts` | `_app.c.$.tsx` and `_app.search.tsx`: skips client-only param changes and non-ambient mutations |
| `api-client.ts` | `resource.api.client.$resource.ts` |
| `shared.ts` | helpers: `getActionPath`, `isContextMutation`, `isIdentityMutation`, `isAmbientMutation` |

`_app.tsx` exports `shouldRevalidate() { return false }` (navigation data that no shopper action changes). `resource.basket-products.ts` opts in only when `actionResult.basket.basketId` exists.

"Ambient" mutations (site/currency, shopper context, login/signup/logout) change request-wide inputs and legitimately re-run most loaders.

## Add a policy for a new route

Prefer suppress-by-default allowlists for expensive loaders, and defer to the default for cheap ones:

```ts
// src/lib/revalidation/routes/store-events.ts
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import { resourceRoutes } from '@/route-paths';
import { getActionPath, isAmbientMutation } from './shared';

const RELEVANT = [resourceRoutes.setSelectedStore] as readonly string[];

export function shouldRevalidate({ currentUrl, nextUrl, formMethod, formAction, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
    if (formMethod && formMethod !== 'GET') {
        const path = getActionPath(formAction, currentUrl.origin);
        return Boolean(path && (isAmbientMutation(path) || RELEVANT.includes(path)));
    }
    if (currentUrl.pathname !== nextUrl.pathname) return true;
    return defaultShouldRevalidate; // explicit revalidate() still works; client-only params stay skipped
}
```

Steps:

1. List what the loader reads (fetched fields, URL params, cookies, context such as currency or selected store).
2. List the actions reachable while this route is active (page, shell, open modals and drawers). Mark overlap and availability per action.
3. Export the policy. Admit only mutations with overlap and no other delivery path. Document each admit in a comment.
4. If a URL-filtered loader (search params) re-runs on navigation anyway, skip revalidating when only those params change.
5. Add a test next to the policy (`*.test.ts`), covering an admitted mutation, a skipped mutation and a navigation.
6. Verify manually: open DevTools Network, perform the gesture, and count loader (`.data`) requests.

Gate adequacy matters: a policy that only checks `formAction` is set still re-runs on every action. Inspect the action path or `actionResult`.

## Tags for cross-route contracts

When several routes depend on the same data, use the tag primitives in `@/lib/revalidation/tags` (the framework ships primitives only; you own the catalogs):

```ts
// src/lib/revalidation/tags/cart.ts  (yours)
export const cartTags = { all: 'cart.*', lineItem: (id: string) => `cart.lineItems:${id}` as const } as const;

// action: emit
import { withRevalidateTags } from '@/lib/revalidation/tags';
return withRevalidateTags({ basket }, [cartTags.lineItem(itemId)]);

// route: subscribe
import { shouldRevalidateForTags } from '@/lib/revalidation/tags';
export const shouldRevalidate = shouldRevalidateForTags([cartTags.all]);
```

Spell tags only through catalog builders (a typo silently matches nothing). Syntax: dot-separated segments, optional `:id`, `.*` wildcard is subscriber-only. Helpers: `tagGroup`, `tagImplications`, `matchesTag`, `normalizeTags`, `resolveTags`; `shouldRevalidateForTags(spec, { ambient, expand })`. An untagged action falls back to default behavior. See `src/lib/revalidation/tags/index.example.test.ts` and details in [POLICIES-AND-TAGS.md](references/POLICIES-AND-TAGS.md).

## Related levers

- Add-to-cart, promo and quantity changes update the basket through `updateBasketResource` and `BasketProvider` (`src/providers/basket.tsx`), so pages rarely need loader re-runs to show the new basket.
- `useRevalidateOnReturn` (`@/hooks/use-revalidate-on-return`) refreshes stale data when the shopper returns to the tab or page.
- Modals and drawers mount lazily; a quick-view that both loads product data and submits add-to-cart widens the active set and triggers it. Keep its fetcher unmounted until open and consider moving the submit elsewhere.
- Leave `shouldRevalidate` gates on root-level session, site and config loaders conservative: the root policy defaults to revalidate.

## Finding more

`docs/README-REVALIDATION.md`, `docs/README-DATA.md`, `docs/README-STATE.md` and `AGENTS.md` in your project. `b2c docs search "revalidation"` or the `docs_search` MCP tool for product docs.

## Related Skills

- `storefront-next:sfnext-data-fetching` - loaders, actions, fetchers
- `storefront-next:sfnext-performance` - review checklist (revalidation scope section)
- `storefront-next:sfnext-state-management` - providers that make a re-run unnecessary
- `storefront-next:sfnext-routing` - route files that export policies
- `storefront-next:sfnext-testing` - tests for policies
