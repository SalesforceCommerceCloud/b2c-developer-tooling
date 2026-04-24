---
name: sfnext-hybrid-storefronts
description: Implement hybrid storefronts that run Storefront Next alongside SFRA or SiteGenesis. Use when planning gradual migration from SFRA, configuring hybrid proxy for local development, setting up session bridging between storefronts, or routing traffic between old and new implementations.
---

# Hybrid Storefronts Skill

This skill covers running Storefront Next alongside an existing SFRA or SiteGenesis storefront — enabling gradual migration without a full rewrite.

## Overview

A hybrid storefront splits traffic between Storefront Next (for new or migrated pages) and an existing SFRA/SiteGenesis storefront (for pages not yet migrated). Session bridging ensures users maintain authentication and cart state across both implementations.

## Architecture

```
Customer Request
      ↓
  CDN / eCDN (Cloudflare)        ← Production: routes based on URL patterns
      ↓
  ┌─────────────────────────────┐
  │ Storefront Next │ SFRA/SiteGenesis │
  │  (MRT)          │  (B2C Instance)  │
  └────────┴────────────────────┘
       ↕ Session Bridge (shared cookies) ↕
```

**Production:** Cloudflare eCDN handles routing between Storefront Next and SFRA based on origin rules.

**Local Development:** A Vite dev server plugin (`hybridProxyPlugin` from `@salesforce/storefront-next-dev`) proxies non-matching requests to your SFCC sandbox, simulating the eCDN split at `localhost:5173`.

## Configuration

Hybrid mode is configured entirely through environment variables — there is no extension directory.

### Application Config (All Environments)

These `PUBLIC__` variables are bundled into the app and required in all environments:

```bash
# Enable hybrid mode — activates the client-side legacy-routes middleware
PUBLIC__app__hybrid__enabled=true

# Routes that belong to SFRA — client-side <Link> clicks to these trigger full-page loads
# Supports exact paths and React Router parameterized routes
PUBLIC__app__hybrid__legacyRoutes='["/cart", "/checkout", "/product/:id"]'
```

### Proxy Plugin Config (Local Development Only)

These configure the Vite dev server proxy and have no effect in production:

```bash
# Enable the proxy
HYBRID_PROXY_ENABLED=true

# Your SFCC sandbox origin
SFCC_ORIGIN=https://zzrf-001.dx.commercecloud.salesforce.com

# Routing rules: Cloudflare eCDN expression format
# Paths matching → Storefront Next; paths not matching → proxied to SFCC
HYBRID_ROUTING_RULES='(http.request.uri.path matches "^/$" or http.request.uri.path matches "^/product.*" or http.request.uri.path matches "^/category.*" or http.request.uri.path matches "^/resource.*" or http.request.uri.path matches "^/action/.*")'

# Optional: locale for SFRA path transformation (falls back to PUBLIC__app__i18n__fallbackLng)
HYBRID_PROXY_LOCALE=en-GB
```

## Client-Side Navigation Middleware

The `legacy-routes.client.ts` middleware intercepts client-side navigation to SFRA-owned routes:

1. User clicks `<Link to="/checkout">`
2. React Router begins client-side navigation
3. Middleware checks if `/checkout` matches any pattern in `legacyRoutes`
4. If yes → forces a full-page navigation so the CDN/proxy routes to SFRA
5. If no → continues normal client-side rendering

This prevents React Router from trying to render pages that belong to SFRA.

## Session Bridging

Both storefronts share the same session cookies (`dwsid`, `cc-*`) on a common domain:

### Cookie Handling (Local Dev)

The proxy handles cookies in three layers:
1. **Set-Cookie header rewriting** — SFCC response `Domain=.salesforce.com` → `Domain=localhost`
2. **Storefront Next server cookies** — Written directly to localhost, no rewriting needed
3. **Client-side cookie interception** — Injected script patches `document.cookie` for SFRA's JS

### SFRA to Storefront Next

When navigating from SFRA to Storefront Next:
1. SFRA provides session credentials (dwsgst/dwsrst tokens)
2. Storefront Next exchanges the bridge token for SLAS tokens
3. Normal SLAS cookie-based auth resumes

### Storefront Next to SFRA

When navigating from Storefront Next to SFRA:
1. Shared `dwsid` cookie maintains session continuity
2. Full-page navigation triggered by legacy-routes middleware
3. CDN/proxy routes request to SFCC origin

## Traffic Routing Patterns

### Gradual Migration Strategy

1. **Phase 1** — Homepage, product, and category pages on Storefront Next
2. **Phase 2** — Account and search pages
3. **Phase 3** — Cart and checkout flow
4. **Phase 4** — Full migration, remove SFRA

### Required Routing Rules

Some patterns must always route to Storefront Next:

| Pattern        | Why                                            |
| -------------- | ---------------------------------------------- |
| `^/resource.*` | React Router resource routes (data endpoints)  |
| `^/action/.*`  | React Router actions (form submissions)        |

### Keep Rules in Sync

`HYBRID_ROUTING_RULES` (what Storefront Next owns) and `PUBLIC__app__hybrid__legacyRoutes` (what SFRA owns) are complementary. Any path not in routing rules that could be a `<Link>` target should be in `legacyRoutes`.

## Common Considerations

- **Cookie domains** — Both storefronts must share a cookie domain for session bridging
- **CDN configuration** — Update eCDN origin rules as pages migrate
- **SEO continuity** — Maintain URL structure to preserve search rankings
- **Cart synchronization** — Basket state is consistent via shared session cookies

## Troubleshooting

| Issue                             | Cause                      | Solution                                          |
| --------------------------------- | -------------------------- | ------------------------------------------------- |
| Lost session crossing storefronts | Cookie domain mismatch     | Ensure shared parent domain                       |
| Cart items disappear              | Basket not synced          | Verify session bridge cookies (`dwsid`, `cc-*`)   |
| Redirect loops                    | Conflicting routing rules  | Check eCDN rules and `legacyRoutes` consistency   |
| 404 on SFRA pages (local dev)     | Missing from routing rules | Add path to `HYBRID_ROUTING_RULES`                |
| React Router 404 on legacy route  | Missing from legacyRoutes  | Add path to `PUBLIC__app__hybrid__legacyRoutes`   |

## Related Skills

- `storefront-next:sfnext-authentication` - SLAS token management and session cookies
- `storefront-next:sfnext-deployment` - MRT deployment for hybrid setup
- `storefront-next:sfnext-configuration` - Environment configuration for hybrid mode
