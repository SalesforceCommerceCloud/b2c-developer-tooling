# Multi-Site, URLs, Domains, Base Path, and Cookie Domain

Everything that decides which site/locale a request is for and what URLs look like. Depth ships in the project: `docs/README-MULTI-SITE.md` (URL config, SEO routes, switchers), `docs/README-MULTI-DOMAIN.md`, `docs/README-BASE-PATH.md`, `docs/README-COOKIE-DOMAIN.md`, and `docs/migrations/seo-url-rules/README.md`. Read the relevant one before changing these settings.

## Quick decision table

| Goal | Setting | Rebuild needed? |
| --- | --- | --- |
| Add a site or locale | `commerce.sites` (or MRT Data Store sites), i18n locale files | No (env) |
| Change what the site/locale segments look like | `app.siteAliasMap`, `app.localeAliasMap` | No |
| Change URL shape (`/:siteId/:localeId`) | `app.url.prefix` / `search` / `excludeRoutes` | **Yes**, protected |
| Custom product/category URL prefixes | `app.url.seoRoutes` | **Yes**, protected |
| Many domains, one environment | CDN + `X-Forwarded-Host` (automatic), `images.realmHostMappings` | No |
| One domain, many environments | `runtime.ssrParameters.envBasePath` | Yes, pushed with `pnpm push` |
| Share cookies across subdomains | `app.cookies.domain` / per-site override + Business Manager | No |

## Sites and locales

Sites are defined in `config.server.ts` under `app.commerce.sites` and selected with `app.defaultSiteId`. Override from the environment:

```bash
PUBLIC__app__defaultSiteId=MySite
PUBLIC__app__commerce__sites='[{"id":"MySite","defaultLocale":"en-US","defaultCurrency":"USD","supportedLocales":[{"id":"en-US","preferredCurrency":"USD"},{"id":"de-DE","preferredCurrency":"EUR"}],"supportedCurrencies":["USD","EUR"]}]'
```

- Each `supportedLocales` entry needs matching translation files under `src/locales/<locale>/` and to be listed in `app.i18n.supportedLngs`, otherwise the locale selector hides it. The currency switcher only shows when the site has more than one supported currency (`storefront-next:sfnext-i18n`).
- `commerce.sitesFromDal` is **on by default**: live site data from the MRT Data Store replaces the static `commerce.sites` for site/locale/currency resolution. If the Data Store is unavailable, or the default site is missing from it, the static list is used. Opt out with `PUBLIC__app__commerce__sitesFromDal=false`. URL aliases always come from `siteAliasMap` / `localeAliasMap`, never from the Data Store.
- There is no `siteId` under `commerce.api`; the site is a per-request parameter that `createApiClients(context)` adds to every SCAPI call.

### Reading the current site

The site is resolved per request by the site-context middleware from the URL, cookie, or header.

```typescript
// Component
import { useSite } from '@salesforce/storefront-next-runtime/site-context';
const { site, language, currency } = useSite();   // throws outside SiteProvider (mounted in root.tsx)

// Loader / action / middleware
import { siteContext } from '@salesforce/storefront-next-runtime/site-context';
const siteId = context.get(siteContext)?.site?.id;
```

Never use `config.commerce.sites[0]` as "the current site".

## URL shape (`app.url`)

Default in the template:

```typescript
url: {
  prefix: '/:siteId/:localeId',
  excludeRoutes: ['/resource/**', '/action/**'],
},
```

Pages then live at `/global/en-GB/product/...`; bare `/` is redirected to the default site/locale by the home route loader. `prefix` and `search` accept `:siteId` and `:localeId`; alternatives (locale only, site in path with `?lng=`, everything in query params) are in README-MULTI-SITE "URL Config Use Cases".

Rules:

- `url.prefix`, `url.excludeRoutes`, `url.seoRoutes` are **protected**: compiled into routes at build time. Edit `config.server.ts`, rebuild, redeploy. Setting `PUBLIC__app__url__...` throws.
- If you change the prefix order or drop site/locale from the path, update `app.siteDetectionConfig` / `app.localeDetectionConfig` (`order`, `lookupFromPathIndex`, `lookupQuerystring`, `lookupHeader`) so detection reads back what `buildUrl` writes. Locale query param key must stay `lng`; the default site query key is `site`.
- Detection defaults: site order `path, querystring, cookie, header` (header `X-Site-Id`, cookie `site_id`); locale order `path, querystring, cookie, header` (cookie `lng`).

### Aliases

```typescript
siteAliasMap: { RefArchGlobal: 'global', RefArch: 'us' },   // app.siteAliasMap
localeAliasMap: { 'en-US': 'us' },                           // app.localeAliasMap
```

Optional. Without them raw IDs appear in URLs. Changing an alias changes public URLs; plan redirects.

### Building URLs correctly

| Where | Use |
| --- | --- |
| JSX links | `Link` / `NavLink` from `@/components/link` |
| Imperative navigation | `useNavigate` from `@/hooks/use-navigate` |
| Loader/action redirects | `redirect(buildUrlFromContext('/login', context))` from `@/lib/url.server` |
| `<Form action>` | Prefix manually with `buildUrl` from `@salesforce/storefront-next-runtime/site-context` + `useCurrentSiteAndLocaleRef` (`@/hooks/use-current-site-and-locale-ref`); React Router `<Form>` does not prefix |
| Typed route patterns | `routeHref` from `@/route-paths` |

Importing `Link`/`useNavigate` from `react-router` produces unprefixed URLs that 404.

### SEO routes (`url.seoRoutes`)

Replicate Business Manager product/category URL prefixes into the route table, keyed by Commerce site ID:

```typescript
url: {
  prefix: '/:siteId/:localeId',
  excludeRoutes: ['/resource/**', '/action/**'],
  seoRoutes: {
    RefArchGlobal: { product: { prefix: 'p' }, category: { prefix: 'c', mode: 'id-suffix' } },
    RefArch:       { product: { prefix: 'product' }, category: { prefix: 'category', mode: 'id-suffix' } },
  },
},
```

- Every active site needs an entry, or the build fails for the omitted ones.
- Category `mode`: `id-suffix` (deterministic, ID in last segment) or `slug-path` (needs Shopper Products 1.13 and Shopper Search 1.15 on the instance).
- Prefixes are single static segments; invalid, reserved, duplicate, or colliding prefixes fail the build. The canonical product/category route modules must be leaf routes.
- Build links with `createProductUrl` / `createCategoryUrl*` and `useSeoUrlContext()` rather than hand-built paths. Mapping from Business Manager is manual and one-directional.
- Legacy or unmatched URLs can resolve via the Shopper SEO URL mapping fallback (`app.seoFallback.sites`). Read `docs/migrations/seo-url-rules/README.md` before enabling (redirect loops, indexed URLs).

## Multiple domains, one environment

One MRT environment can serve many domains. The public origin is taken per request from `X-Forwarded-Host` / `X-Forwarded-Proto`, so links, SLAS `redirect_uri`, magic-link emails, canonical/hreflang tags, and JSON-LD use the domain the shopper used. Nothing to configure in the storefront except:

- Attach each domain as an external hostname on the MRT environment and add each domain's callback URLs to the SLAS client's redirect list.
- `EXTERNAL_DOMAIN_NAME` is only a fallback when no forwarded host exists (startup, local dev); leave the default.
- `images.realmHostMappings` (`[{ hostSuffix, realm }]`) so DIS resolves the realm on custom domains.
- To map each domain to a different site, have the CDN set `X-Site-Id` per domain and configure `url.prefix: '/:localeId'`, `siteDetectionConfig: { order: ['header','cookie'], lookupHeader: 'X-Site-Id' }`, `localeDetectionConfig: { lookupFromPathIndex: 0 }`. If the edge cannot inject headers, keep the site in the URL path.
- Keep cookies host-only across unrelated brand domains.

## Base path (one domain, many environments)

`runtime.ssrParameters.envBasePath: '/storefront-a'` in `config.server.ts` serves one environment under a path segment (single segment, `/` + up to 63 URL-safe chars). The value is sent to MRT during `pnpm push`; the CDN routes by that first segment and MRT does not strip it. Routes, bundle asset URLs, and React Router `basename` adapt automatically, and site/locale path detection skips the base path.

Caveats: raw `fetch()` / `sendBeacon()` from client code must prepend `getBasePath()` from `@/lib/utils`; `redirect()` in middleware is not auto-prefixed; `request.url` still includes the base path; fixed Express routes (e.g. health check) are served without it. Locally `pnpm dev` / `pnpm start` read it from `config.server.ts` and redirect unprefixed requests.

## Cookie domain

Cookies are host-only by default. To share a session across subdomains (or with SFRA in a hybrid setup):

```bash
PUBLIC__app__cookies__domain=.example.com     # global default
```

Per-site override: `commerce.sites[].cookies.domain` (wins over the global value). The domain applies to every cookie the storefront writes (auth/session and site-context). It must be a parent of the serving host or browsers silently drop the cookies. Do **not** set `app.siteContext.cookieOptions.domain` (ignored).

Business Manager must agree: **Merchant Tools > Site Preferences > Hybrid Auth Settings** cookie-domain level `0` (host only) when unset, `2` (first-level parent domain) when set. Level `1` is rejected. A mismatch breaks cross-subdomain sessions or creates duplicate cookies. Verify with `curl -sI https://www.example.com/ | grep -i set-cookie` (same `Domain=` on every cookie, no duplicates). See `storefront-next:sfnext-hybrid-storefronts` for the hybrid side.

## Switchers

Site, locale, and currency switchers post to `/action/set-site-context` (which sets `site_id`, `lng`, and the currency cookie and redirects). Currency resolution order: cookie, then the locale's `preferredCurrency`, then the site's `defaultCurrency`.
