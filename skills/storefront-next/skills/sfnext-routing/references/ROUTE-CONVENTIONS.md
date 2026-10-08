# Route conventions

## File name to URL

| File | URL (before the site/locale prefix) |
|---|---|
| `_app._index.tsx` | `/` |
| `_app.cart.tsx` | `/cart` |
| `_app.account.orders.$orderNo.tsx` | `/account/orders/:orderNo` |
| `_app.p.$.tsx` | product splat (shape set by `url.seoRoutes`; use `createProductUrl`) |
| `_app.c.$.tsx` | category splat (shape set by `url.seoRoutes`; use `createCategoryUrl`) |
| `_checkout.checkout.tsx` | `/checkout` |
| `_empty.login.tsx` | `/login` |
| `action.cart-item-add.tsx` | `/action/cart-item-add` |
| `resource.recommendations.ts` | `/resource/recommendations` |
| `resource.api.client.$resource.ts` | `/resource/api/client/:resource` |

- A segment starting with `_` and no matching file content of its own is a pathless layout (`_app`, `_checkout`, `_empty`). The layout file (`_app.tsx`) renders `<Outlet />`.
- A nested layout is a route file plus children, for example `_app.account.tsx` with `_app.account.overview.tsx` beneath it.
- `.ts` is enough for routes without JSX (actions, resource routes, `_empty.logout.ts`).
- Files named `*.test.ts(x)` beside routes are ignored by route discovery.

## Route module exports

| Export | Purpose |
|---|---|
| `loader` | server data for the route (see `storefront-next:sfnext-data-fetching`) |
| `action` | server mutation |
| default component | receives `loaderData` via `Route.ComponentProps` |
| `shouldRevalidate` | revalidation policy; most routes re-export from `@/lib/revalidation/routes/*` (see `storefront-next:sfnext-revalidation`) |
| `middleware` | route-level server middleware (root chain lives in `src/root.tsx`) |
| `ErrorBoundary` | route-scoped error UI (for example wishlist load failures) |
| `links` / `meta` | mostly used in `src/root.tsx`; prefer `<SeoMeta>` in components |
| Page Designer classes | `@PageType` and `@RegionDefinition` on an exported class, see `storefront-next:sfnext-page-designer` |

`clientLoader` and `clientAction` are not permitted.

## Typed route props

```tsx
import type { Route } from './+types/_app.cart';

export async function loader({ request, context, params }: Route.LoaderArgs) { /* ... */ }
export default function Cart({ loaderData }: Route.ComponentProps) { /* ... */ }
```

The `+types` modules are generated. Run `pnpm typecheck` or `pnpm dev` to create them.

## Layout notes

- `_app.tsx` loads navigation categories once and exports `shouldRevalidate() { return false }`, so the header data is not re-fetched on later navigations. Change this only if you add navigation that must update.
- `_empty.tsx` is a minimal `<main>` with a skip link, used by login, signup, callbacks, maintenance and the component preview.
- `_checkout.tsx` provides the checkout layout.
- `_app.account.tsx` is the account layout and redirects unauthenticated shoppers to login.

## Head tags

`SeoMeta` props: `title`, `rawTitle`, `description`, `noIndex`, `siteName`, `twitter`, `openGraph`. Use `noIndex` on account and transactional pages. `JsonLd` takes `data`, optional `id` and `nonce`. Both can be rendered anywhere in the tree, including inside a Suspense boundary.

## Checklist when renaming or deleting a route

1. Update `src/route-paths.ts`.
2. Search for the old path in links, redirects, `resourceRoutes` users and tests.
3. Re-run `pnpm typecheck` to regenerate `+types`.
4. If the route is referenced by `shouldRevalidate` policies in `src/lib/revalidation/routes/`, update those.
