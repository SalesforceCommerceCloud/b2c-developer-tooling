# Hybrid Proxy Configuration Reference

Authoritative guide in your project: `docs/README-HYBRID-PROXY.md`. Plugin wiring: `vite-plugins/hybrid-proxy.ts`.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `PUBLIC__app__hybrid__enabled` | all environments | Activates the client-side legacy-routes middleware. Default `false`. |
| `PUBLIC__app__hybrid__legacyRoutes` | all environments | JSON array of SFRA-owned routes (strings or `{ pattern, suffix }`). |
| `HYBRID_PROXY_ENABLED` | dev only | `true` turns the proxy on. |
| `SFCC_ORIGIN` | dev only | Full HTTPS URL of the SFRA sandbox. Highest priority target. |
| `SCAPI_PROXY_HOST` | dev only | Secondary target-origin override. |
| `HYBRID_ROUTING_RULES` | dev only | Cloudflare-style expression of paths Storefront Next owns. |
| `HYBRID_PROXY_LOCALE` | dev only, optional | Fallback locale for the SFRA path; else `PUBLIC__app__i18n__fallbackLng`, else `default`. |
| `PUBLIC__app__defaultSiteId` | dev | Site id used in `/s/<siteId>/...`. |

`hybrid` defaults to `{ enabled: false, legacyRoutes: [] }` in `config.server.ts`.

## Routing rule format

```
(http.request.uri.path matches "^/$" or http.request.uri.path matches "^/category.*")
```

Only `http.request.uri.path matches "<regex>"` clauses joined by `or` are parsed. Always include `^/resource.*` and `^/action/.*`. `.data` requests are excluded automatically.

| Pattern | Route |
|---|---|
| `^/$` | Home |
| `^/login.*`, `^/logout.*`, `^/signup.*`, `^/reset-password.*` | Auth pages |
| `^/account.*` | Account |
| `^/product.*`, `^/category.*`, `^/search.*` | Catalog |
| `^/social-callback.*` | Social login callback |

## Path transformation

| Browser URL | Proxied to |
|---|---|
| `/` | `/s/<siteId>` |
| `/cart` | `/s/<siteId>/<locale>/cart` |
| `/on/demandware.static/...`, `/s/...` | unchanged |

With `url.prefix` set in `config.server.ts`:

| `url.prefix` | URL | Proxied to |
|---|---|---|
| `/:localeId` | `/uk/cart` | `/s/<siteId>/uk/cart` |
| `/:localeId` | `/cart` | `/s/<siteId>/<fallback locale>/cart` (`cart` is not a known locale) |
| `/:siteId/:localeId` | `/global/en-GB/cart` | `/s/global/en-GB/cart` |

Query strings are preserved.

## Cookie layers (local dev)

1. Set-Cookie headers from SFCC: `Domain=.salesforce.com` rewritten to `localhost`.
2. Storefront Next's own cookies are written to `localhost` directly.
3. Injected `document.cookie` patch in proxied HTML so SFRA client-side cookie writes get the same treatment (SFRA omits `Secure` on `http://localhost`). Localhost-only; no production equivalent.

## Custom matcher (last resort)

Edit `vite-plugins/hybrid-proxy.ts`:

```typescript
import { hybridProxyPlugin, shouldRouteToNext } from '@salesforce/storefront-next-dev';

hybridProxyPlugin({
    // ...existing options...
    routeMatcher: (pathname, rules) => {
        if (pathname === '/my-custom-page') return true;   // Storefront Next
        if (pathname === '/legacy-only') return false;     // SFRA
        return shouldRouteToNext(pathname, rules);         // default eCDN-style matching
    },
    // rewritePath: (pathname) => myRewrite(pathname) ?? null, // non-standard URL models only
});
```

If the matcher throws, the request falls through to React Router. Overriding the matcher means local routing no longer matches eCDN behavior; avoid unless necessary.

## Gotchas

- Rules out of sync with eCDN: local behavior differs from production.
- A proxied path that does not exist on SFRA returns whatever SFCC returns.
- `HYBRID_PROXY_LOCALE` must be a locale SFRA accepts in `/s/<site>/<locale>/`; match the site's `defaultLocale`.
- Unsupported compression formats skip body rewriting and leak SFCC URLs.
- Production: do not rely on the plugin; configure eCDN routing (`b2c-cli:b2c-ecdn`) and the same cookie domain on both sides.
