---
name: sfnext-routing
description: >-
  Add and change pages in a Storefront Next project: flat-file routes in src/routes, layout routes (_app, _checkout, _empty), splat routes for product and category pages, action.* and resource.* routes, src/route-paths.ts (routes, resourceRoutes, routeHref), site-aware Link and useNavigate wrappers, SeoMeta and JsonLd head tags, multi-site /:siteId/:localeId URL prefixes, url.seoRoutes and excludeRoutes, extension routes, and the SLAS callback routes. Use for "add a page", "new route", "why is my link missing the site prefix", "route file naming", "redirect to login", or a 404 on a new URL. Do not use for loader/action/fetcher data code (use `storefront-next:sfnext-data-fetching`), shouldRevalidate (use `storefront-next:sfnext-revalidation`), SEO strategy such as sitemaps and canonical rules (use `storefront-next:sfnext-seo`), or Page Designer regions (use `storefront-next:sfnext-page-designer`).
---

# Storefront Next Routing

Storefront Next uses React Router 7 framework mode with file-based routes. Every route module lives in `src/routes/`; the file name is the URL. Your project also ships `docs/README-MULTI-SITE.md` (URL prefix, locale and site detection) and `docs/README-SEO.md` (titles, meta tags, canonical URLs); read those for depth.

## How routes are discovered

`src/routes.ts` imports `flatRoutes` from `@salesforce/storefront-next-runtime/routing` (not `@react-router/fs-routes`). It is a drop-in wrapper that:

1. scans `src/routes/` (test files are ignored),
2. merges routes from `src/extensions/<name>/routes/` (see `storefront-next:sfnext-extensions`),
3. wraps every route in the `app.url.prefix` pattern (default `/:siteId/:localeId`) through `src/app-wrapper.tsx`, and applies `app.url.seoRoutes` aliases to the product and category splats.

The two SLAS callback routes (`resource.slas-reset-password-callback.ts`, `resource.slas-passwordless-login-callback.ts`) are deliberately excluded from discovery in `src/routes.ts` and registered by hand at the bare paths `/reset-password-callback` and `/passwordless-login-callback`, outside the prefix, so a single callback URL works for all sites. If you add another server-to-server callback that cannot carry a site prefix, follow the same pattern in `src/routes.ts`.

## Route tree (what exists)

| Pattern | Files | Notes |
|---|---|---|
| `_app` layout | `_app.tsx` | header/footer shell; loads navigation; `shouldRevalidate` returns `false` |
| Home, search, cart, wishlist | `_app._index.tsx`, `_app.search.tsx`, `_app.cart.tsx`, `_app.wishlist.tsx`, `_app.about-us.tsx` | |
| Product detail | `_app.p.$.tsx` | splat; URL shape is build-time configurable (`url.seoRoutes`) |
| Category / listing | `_app.c.$.tsx` | splat; URL shape is build-time configurable (`url.seoRoutes`) |
| Account | `_app.account.tsx` (layout + auth guard), `_app.account.overview`, `.orders`, `.orders.$orderNo`, `.addresses`, `.payment-methods`, `.wishlist`, `.passkeys`, `.store-preferences` | |
| Orders | `_app.order-confirmation.$orderNo.tsx`, `_app.order-lookup.*` (`results.$orderNo`, `verify.$orderNo`) | param is `$orderNo` |
| `_checkout` layout | `_checkout.tsx`, `_checkout.checkout.tsx` | checkout chrome |
| `_empty` layout | `_empty.tsx`, `_empty.login`, `.signup`, `.forgot-password`, `.reset-password`, `.logout`, `.maintenance`, `.oauth2.jwks`, `.preview.component`, `_empty.$.tsx` (catch-all) | no header/footer; there is no `_auth` layout |
| Mutations | `action.*.ts(x)` (cart, wishlist, checkout, OTP, passkey, consent, site context...) | no UI; see `storefront-next:sfnext-data-fetching` |
| Data endpoints | `resource.*.ts(x)` (recommendations, basket-products, category-products, analytics-proxy, `resource.api.client.$resource.ts`...) | no UI |

Naming rules (flat routes): `.` becomes `/`, `$name` is a param, `$` alone is a splat, a leading `_` segment is a pathless layout, `_index` is the index route. Pick the layout by prefix: `_app.` for standard pages, `_checkout.` for checkout, `_empty.` for header-less pages.

## Add a page

```tsx
// src/routes/_app.shipping-policy.tsx  ->  /shipping-policy
import type { Route } from './+types/_app.shipping-policy';
import { SeoMeta } from '@/components/seo-meta';
import { Link } from '@/components/link';
import { routes } from '@/route-paths';

export async function loader({ request }: Route.LoaderArgs) {
    return { pageUrl: new URL(request.url).href };
}

export default function ShippingPolicy({ loaderData }: Route.ComponentProps) {
    return (
        <>
            <SeoMeta title="Shipping policy" description="How we ship." openGraph={{ url: loaderData.pageUrl }} />
            <h1>Shipping policy</h1>
            <Link to={routes.cart}>Back to cart</Link>
        </>
    );
}
```

Checklist for a new page:

1. Create the file under `src/routes/` with the right layout prefix.
2. Import types from `./+types/<file-name>` (`Route.LoaderArgs`, `Route.ComponentProps`, `Route.ActionArgs`). These are generated by `pnpm typecheck` (runs `react-router typegen`) and `pnpm dev`; run one if the import is unresolved.
3. Add an entry to `routes` (page) or `resourceRoutes` (action/resource) in `src/route-paths.ts`. That file is the single source of truth for navigable paths. Keep it in sync when you rename or delete route files.
4. Render `<SeoMeta>` (and `<JsonLd>` from `@/components/json-ld` for structured data) inside the component. React 19 hoists these tags to `<head>` and they work with streaming. Use `meta` exports only when a route already does.
5. Add locale strings for user-facing text (`storefront-next:sfnext-i18n`) and a test next to the route (`storefront-next:sfnext-testing`).

## Links and navigation: always use the project wrappers

```tsx
import { Link, NavLink } from '@/components/link';
import { useNavigate } from '@/hooks/use-navigate';
import { href } from 'react-router';
import { routes, routeHref, resourceRoutes } from '@/route-paths';

<Link to={routes.cart}>Cart</Link>
<Link to={routeHref(routes.accountOrderDetail, { orderNo })}>Order</Link>
```

`Link`, `NavLink` and `useNavigate` from `@/components/link` and `@/hooks/use-navigate` apply the site/locale prefix (`buildUrl`). The React Router originals compile but silently produce unprefixed URLs that break multi-site routing. `AGENTS.md` makes this a hard rule.

For product and category URLs use the helpers in `@/route-paths` (`createProductUrl`, `createCategoryUrl`, `createCategoryNavigationUrl`) with the SEO URL context so links follow `url.seoRoutes`. In server code (redirects), use `buildUrlFromContext(routes.login, context)` from `@/lib/url.server`:

```ts
import { redirect } from 'react-router';
import { routes } from '@/route-paths';
import { buildUrlFromContext } from '@/lib/url.server';

throw redirect(buildUrlFromContext(routes.login, context));
```

Form and fetcher `action` targets come from `resourceRoutes` (for example `resourceRoutes.cartItemAdd`), which are excluded from the site prefix via `app.url.excludeRoutes` in `config.server.ts` (`['/resource/**', '/action/**']` by default). A new `action.*` or `resource.*` route needs no prefix handling; a new page route gets it automatically.

## URL configuration

`app.url` in `config.server.ts` (`prefix`, `excludeRoutes` and `seoRoutes` are protected config paths: set them in the file and rebuild, they cannot be overridden with `PUBLIC__` env vars; see `storefront-next:sfnext-configuration`) controls `prefix`, `excludeRoutes`, search-param mode, detection and `seoRoutes` (configurable product and category URL grammars). Changing the prefix or `seoRoutes` affects every link; follow `docs/README-MULTI-SITE.md` in your project rather than editing ad hoc.

## Protecting routes

There is no `_auth` layout. Guard in the loader: read the session with `getAuth(context)` from `@/middlewares/auth.server` and `throw redirect(...)` to `routes.login` (see `_app.account.tsx` and `_app.wishlist.tsx`). Auth details: `storefront-next:sfnext-authentication`.

## Rules to keep in mind

- Only server `loader` and `action` exports are allowed; no `clientLoader`/`clientAction`.
- Throw `new Response('...', { status: 404 })` for missing content so the right HTTP status reaches crawlers.
- Resource routes called from the browser should reject cross-origin requests (see `resource.recommendations.ts` for the pattern).
- Deeper references: [ROUTE-CONVENTIONS.md](references/ROUTE-CONVENTIONS.md) for exports and naming, [URLS-AND-SEO-ROUTES.md](references/URLS-AND-SEO-ROUTES.md) for prefixes and SEO aliases.

## Finding more

Read `AGENTS.md` in your project for the doc index. For other framework questions use `b2c docs search "storefront next routing"` (or the `docs_search` MCP tool).

## Related Skills

- `storefront-next:sfnext-data-fetching` - loaders, actions, fetchers
- `storefront-next:sfnext-revalidation` - `shouldRevalidate` policy per route
- `storefront-next:sfnext-seo` - canonical URLs, structured data, sitemaps
- `storefront-next:sfnext-page-designer` - `@PageType` and regions on routes
- `storefront-next:sfnext-extensions` - routes contributed by extensions
- `storefront-next:sfnext-authentication` - sessions and login flows
- `storefront-next:sfnext-overview` - architecture map
