# Hybrid Proxy Configuration Reference

## Overview

The hybrid proxy is a **Vite dev server plugin** (`hybridProxyPlugin` from `@salesforce/storefront-next-dev`) that routes requests between Storefront Next and SFRA based on URL patterns during local development. In production, Cloudflare eCDN handles routing.

## Environment Variables

### All Environments

```bash
# Enable hybrid mode (activates client-side legacy-routes middleware)
PUBLIC__app__hybrid__enabled=true

# Routes owned by SFRA — Link clicks to these force full-page navigation
# Supports exact paths and React Router parameterized routes (/product/:id)
PUBLIC__app__hybrid__legacyRoutes='["/cart", "/checkout"]'
```

### Local Development Only

```bash
# Enable the Vite proxy
HYBRID_PROXY_ENABLED=true

# SFCC sandbox URL (the actual hostname, not the SCAPI base URL)
SFCC_ORIGIN=https://zzrf-001.dx.commercecloud.salesforce.com

# Cloudflare-style routing expression
# Paths matching → Storefront Next; paths not matching → proxied to SFCC
HYBRID_ROUTING_RULES='(http.request.uri.path matches "^/$" or http.request.uri.path matches "^/product.*" or http.request.uri.path matches "^/category.*" or http.request.uri.path matches "^/search.*" or http.request.uri.path matches "^/account.*" or http.request.uri.path matches "^/resource.*" or http.request.uri.path matches "^/action/.*")'

# Optional: locale for SFRA path transformation
HYBRID_PROXY_LOCALE=en-GB

# Commerce Cloud site ID (likely already set)
PUBLIC__app__defaultSiteId=RefArchGlobal
```

## Routing Rules Format

Each clause follows `http.request.uri.path matches "<regex>"`, joined with `or`:

```
(http.request.uri.path matches "^/$" or http.request.uri.path matches "^/category.*")
```

This is the same format used by Cloudflare eCDN origin rules — keep local and production in sync.

### Required Patterns

| Pattern        | Why                                              |
| -------------- | ------------------------------------------------ |
| `^/resource.*` | React Router resource routes (server endpoints)  |
| `^/action/.*`  | React Router actions (form submissions)          |

### Automatically Excluded Paths (never proxied)

- `/@*`, `/__*` — Vite internals
- `/src/*`, `/node_modules/*` — Source files
- `*.data` — React Router data requests
- `/mobify/*` — SCAPI proxy paths
- Static asset extensions (`.js`, `.css`, `.png`, `.woff2`, etc.)

SFRA static assets (`/on/demandware.static/*`, `/on/demandware.store/*`) are always proxied.

## Path Transformation

The proxy rewrites paths to SFRA format automatically:

| Browser URL    | Proxied to SFCC as                    |
| -------------- | ------------------------------------- |
| `/cart`        | `/s/RefArchGlobal/en-GB/cart`         |
| `/checkout`    | `/s/RefArchGlobal/en-GB/checkout`     |

The `siteId` comes from `PUBLIC__app__defaultSiteId`. The locale uses `HYBRID_PROXY_LOCALE` → `PUBLIC__app__i18n__fallbackLng` → `default`.

## Cookie Handling (Local Dev)

Three layers keep cookies working on localhost:

1. **Set-Cookie header rewriting** — `Domain=.salesforce.com` → `Domain=localhost`
2. **Storefront Next server cookies** — Written directly to localhost
3. **Client-side cookie interception** — Injected script patches `document.cookie` for SFRA JS

## Custom Route Matching

Override the default `shouldRouteToNext` matcher in `vite.config.ts`:

```typescript
import { hybridProxyPlugin, shouldRouteToNext } from '@salesforce/storefront-next-dev';

hybridProxyPlugin({
    routeMatcher: (pathname, rules) => {
        if (pathname === '/my-custom-page') return true;  // → Storefront Next
        if (pathname === '/legacy-only') return false;    // → SFRA
        return shouldRouteToNext(pathname, rules);        // default
    },
});
```

## CDN Routing (Production)

In production, Cloudflare eCDN origin rules handle the split:

```
# Conceptual — configured in Cloudflare dashboard
/                       → Storefront Next (MRT origin)
/product/*              → Storefront Next (MRT origin)
/category/*             → Storefront Next (MRT origin)
/cart                   → SFRA (B2C Instance origin)
/checkout/*             → SFRA (B2C Instance origin)
/on/demandware.static/* → SFRA (B2C Instance origin)
```

## Shared Cookie Requirements

Both storefronts must share a parent cookie domain:

| Storefront      | Domain              | Cookie Domain   |
| --------------- | ------------------- | --------------- |
| Storefront Next | `www.example.com`   | `.example.com`  |
| SFRA            | `legacy.example.com`| `.example.com`  |
