---
name: sfnext-hybrid-storefronts
description: >-
  Run Storefront Next alongside an existing SFRA or SiteGenesis storefront for a gradual migration. Use for hybrid mode, PUBLIC__app__hybrid__enabled, legacyRoutes (exact, :param, * wildcard, { pattern, suffix }), HYBRID_PROXY_ENABLED, SFCC_ORIGIN, HYBRID_ROUTING_RULES, vite-plugins/hybrid-proxy.ts, the dwsid session bridge, sharing login/cart between SFRA and Storefront Next, eCDN routing rules, cookie domain for hybrid, "[Hybrid Proxy] SFCC returned a redirect to 404", blank proxied pages, or lost sessions when crossing storefronts. Do not use for the cookie-domain settings themselves beyond the hybrid checklist (use `storefront-next:sfnext-security`), auth code (use `storefront-next:sfnext-authentication`), or MRT deployment (use `storefront-next:sfnext-deployment`).
---

# Hybrid Storefronts

A hybrid storefront serves some pages from Storefront Next (on Managed Runtime) and the rest from SFRA/SiteGenesis on the B2C instance, under one hostname.

- **Production:** Cloudflare eCDN routes by URL pattern (see `b2c-cli:b2c-ecdn`). The dev proxy is never used.
- **Local development:** a Vite dev-server plugin proxies non-Storefront-Next paths to your sandbox so both appear at `http://localhost:5173`. It only runs under `pnpm dev` and is a no-op in production builds. Full guide: `docs/README-HYBRID-PROXY.md` in your project.

## Two sets of configuration

| Set | Variables | Where it applies |
|---|---|---|
| App config | `PUBLIC__app__hybrid__enabled`, `PUBLIC__app__hybrid__legacyRoutes` | **Every** environment (local, staging, production) |
| Dev proxy | `HYBRID_PROXY_ENABLED`, `SFCC_ORIGIN`, `HYBRID_ROUTING_RULES`, `HYBRID_PROXY_LOCALE`, `PUBLIC__app__defaultSiteId` | `pnpm dev` only |

```bash
PUBLIC__app__hybrid__enabled=true
PUBLIC__app__hybrid__legacyRoutes='["/cart", "/checkout", "/product/:id", "/categoryLv1/*"]'

HYBRID_PROXY_ENABLED=true
SFCC_ORIGIN=https://zzrf-001.dx.commercecloud.salesforce.com   # your sandbox hostname, not the SCAPI host
HYBRID_PROXY_LOCALE=en-GB                                       # optional; falls back to i18n fallbackLng
HYBRID_ROUTING_RULES='(http.request.uri.path matches "^/$" or http.request.uri.path matches "^/login.*" or http.request.uri.path matches "^/logout.*" or http.request.uri.path matches "^/signup.*" or http.request.uri.path matches "^/reset-password.*" or http.request.uri.path matches "^/account.*" or http.request.uri.path matches "^/social-callback.*" or http.request.uri.path matches "^/product.*" or http.request.uri.path matches "^/category.*" or http.request.uri.path matches "^/search.*" or http.request.uri.path matches "^/resource.*" or http.request.uri.path matches "^/action/.*")'
```

`HYBRID_ROUTING_RULES` lists what **Storefront Next owns** (same Cloudflare `http.request.uri.path matches "<regex>"` clauses, joined by `or`, as your eCDN rules). Anything not matching is proxied to SFRA. `^/resource.*` and `^/action/.*` are always required. Include every auth route you migrated (`/login`, `/logout`, `/signup`, `/reset-password`, `/social-callback`) or login breaks. `legacyRoutes` is the inverse: what SFRA owns, so a `<Link>` to it forces a full page load instead of a React Router 404. Keep both in sync with the production eCDN rules.

## legacyRoutes patterns

Each entry is a string or `{ pattern, suffix }`.

| Form | Example | Matches |
|---|---|---|
| Exact | `/cart` | `/cart` only |
| Named param | `/product/:id` | one segment |
| Wildcard | `/categoryLv1/*` | anything under the prefix (`/categoryLv1/shoes/running`), **not** the bare `/categoryLv1` (list it separately); `*` may appear mid-pattern |
| Catch-all | `*` | every path |
| With suffix | `{ "pattern": "/product/:id", "suffix": ".html" }` | redirect appends `.html` (SFCC SEO URLs) |

The matching middleware is `src/middlewares/legacy-routes.client.ts` (helpers in `legacy-routes.ts`). The eCDN regex `^/categoryLv1.*` matches the bare path while `/categoryLv1/*` does not; use `^/categoryLv1(/.*)?$` on the eCDN side to align them.

## Session bridge

There is no token exchange and no client-side sync. The bridge is the `dwsid` cookie (plus `dw_dnt` for tracking consent):

1. Storefront Next's auth middleware extracts `dwsid` from the SLAS response and persists it.
2. `dwsid` and `dw_dnt` are **not** site-namespaced, so SFRA reads and writes them directly. Other `cc-*` cookies are namespaced per site and are Storefront Next's own.
3. The browser sends them on every request; the next full request to either side sees the shared session.

For this to work across subdomains, cookie domain must be configured on **both** sides and agree: `app.cookies.domain` (or `commerce.sites[].cookies.domain`, or `PUBLIC__app__cookies__domain=.example.com`) in Storefront Next, and Business Manager > Merchant Tools > Site Preferences > **Hybrid Auth Settings** cookie-domain level `2` (level `0` is host-only; level `1` is rejected). Details and verification checklist: `storefront-next:sfnext-security` and `docs/README-COOKIE-DOMAIN.md`. Cookie inventory: `storefront-next:sfnext-authentication`.

## Edit the proxy where customers edit it

The plugin is wired in `vite-plugins/hybrid-proxy.ts` (called from `vite.config.ts`, development mode only). Edit there, not in `vite.config.ts`. It reads `url.prefix` and the site/locale alias catalog from `config.server.ts` automatically.

- **Path rewriting:** `/cart` becomes `/s/<siteId>/<locale>/cart`, `/` becomes `/s/<siteId>`. With `url.prefix` of `/:localeId` or `/:siteId/:localeId` the proxy reuses the site/locale already in the path (`/uk/cart` becomes `/s/<siteId>/uk/cart`), and only treats a segment as site/locale if it is a known id or alias.
- **Escape hatches (last resort):** `rewritePath(pathname)` returns an SFRA path or `null` to fall through; `routeMatcher(pathname, rules)` replaces the matcher. Keep `shouldRouteToNext` as the fallback so dev stays aligned with eCDN.
- Target origin priority: `SFCC_ORIGIN`, then `SCAPI_PROXY_HOST`, then the SCAPI host from `shortCode`.

## Automatic behaviors

- Rewrites `Domain=.salesforce.com` cookies to `localhost`, rewrites SFCC URLs in HTML/JSON bodies, decompresses gzip/brotli/deflate before rewriting, and injects a `document.cookie` interceptor into proxied HTML (localhost workaround only, not used in production).
- Never proxies Vite internals, `*.data`, `/mobify/*` and static asset extensions; always proxies `/on/demandware.static/*` and `/on/demandware.store/*`.
- SFRA `plugin_redirect` answering `200` with a `Location` header is converted to a `302`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Logged out after visiting a Storefront Next page; log says `[Hybrid Proxy] SFCC returned a redirect to 404` | A migrated route is missing from `HYBRID_ROUTING_RULES`; SFCC 404s and clears cookies (proxy strips those `Set-Cookie`s) | Add the path pattern |
| React Router 404 or error boundary when clicking a legacy link | Path missing from `legacyRoutes` | Add it (mind `*` vs bare parent) |
| Session lost crossing storefronts | Cookie domain mismatch, or BM Hybrid Auth level differs | Align both sides; check for duplicate cookies |
| Blank proxied page | Upstream `200` + `Location` (fixed in dev), or unsupported compression | Fix the SFRA cartridge or add an eCDN rule for production |
| Works locally, wrong backend in production | `HYBRID_ROUTING_RULES` drifted from eCDN rules | Sync them |
| Wrong locale in the SFRA path | `url.prefix` or `HYBRID_PROXY_LOCALE` mismatch | Check `url.prefix`; set `HYBRID_PROXY_LOCALE` to the site's default locale |
| Proxy does nothing | `HYBRID_PROXY_ENABLED` not `true`, or not in dev mode | Check `.env` and `pnpm dev` |

Env-var reference, path transformation and custom matcher: [references/HYBRID-PROXY-CONFIG.md](references/HYBRID-PROXY-CONFIG.md).

## Related Skills

- `storefront-next:sfnext-authentication` - cookies and SLAS sessions
- `storefront-next:sfnext-security` - cookie domain, CSP
- `storefront-next:sfnext-deployment` - MRT deployment
- `storefront-next:sfnext-configuration` - `config.server.ts` and `PUBLIC__` overrides
- `storefront-next:sfnext-routing` - site/locale URL prefixes
- `b2c-cli:b2c-ecdn` - production routing rules
- `b2c-cli:b2c-mrt` - Managed Runtime environments
