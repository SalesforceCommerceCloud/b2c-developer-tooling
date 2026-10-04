---
name: sfnext-seo
description: >-
  Storefront Next SEO and AEO/GEO: the SeoMeta component (title, description, noIndex, Open Graph, X cards), JsonLd structured data, canonical URLs and the query-parameter allowlist, hreflang, configurable product/category URLs via url.seoRoutes, semantic URL builders (createProductUrl, createCategoryUrl, useSeoUrlContext), redirectToCanonicalPath, crawler rendering and pagination, and how multi-domain and base path affect generated URLs. Use when adding meta tags or JSON-LD to a route, enabling or changing seoRoutes, fixing duplicate or wrong canonical or og:url URLs, or when a build fails for a missing site in seoRoutes. Do not use for route file naming (use `storefront-next:sfnext-routing`), site/locale config in general (use `storefront-next:sfnext-configuration`), or translations (use `storefront-next:sfnext-i18n`).
---

# Storefront Next SEO

In-project references: `docs/README-SEO.md`, `docs/README-AEO-GEO.md`, `docs/README-MULTI-SITE.md` (URL Config), `docs/README-MULTI-DOMAIN.md`, `docs/README-BASE-PATH.md`, `docs/migrations/seo-url-rules/README.md`. Read them for depth; this skill is the task map.

## Page metadata: SeoMeta

```tsx
import { SeoMeta } from '@/components/seo-meta';

<SeoMeta title={t('meta.title', { defaultValue: 'My Page' })} description={t('meta.description', { defaultValue: '...' })} />
<SeoMeta title="Checkout" noIndex />            {/* private/transactional pages */}
<SeoMeta rawTitle title="Store Name" />         {/* no " | Site Name" suffix */}
<SeoMeta title={name} openGraph={{ type: 'product', url: pageUrl, image }} />
```

Props (verified in `src/components/seo-meta/index.tsx`): `title`, `rawTitle`, `description`, `noIndex`, `siteName`, `twitter`, `openGraph`. Open Graph input auto-derives X card tags unless `twitter` is set. Use `noIndex` for cart, checkout, account, and other non-public pages. Root-level canonical and hreflang descriptors come from `src/utils/seo.ts` and `src/utils/canonical-url.ts`; routes do not add them.

## Structured data: JsonLd

```tsx
import { JsonLd } from '@/components/json-ld';

<JsonLd data={productSchema} id="product-schema" nonce={nonce} />
```

Pass the CSP nonce so the inline script is allowed. Builders live in `src/utils/product-schema.ts`, `category-schema.ts`, `schema-url.ts`. PDP emits `Product`; PLP emits `CollectionPage` + `ItemList` (see `docs/README-AEO-GEO.md`).

## One URL everywhere

Canonical `<link>`, `og:url` and JSON-LD `url` must agree. In loaders:

```ts
import { buildSeoPageUrl } from '@/lib/seo/page-url.server';
import { redirectToCanonicalPath } from '@/lib/seo/canonical-redirect.server';

redirectToCanonicalPath(requestUrl);                 // 301 for trailing slash
const pageUrl = buildSeoPageUrl(context, requestUrl); // origin + canonical path/query
```

Only allowlisted query params survive in canonicals (`CONTENT_PARAMS` in `src/utils/canonical-url.ts`: `q`, `offset`, `sort`, `refine`, `pid` by default). Add a param only if it changes main page content, and add a test next to `canonical-url.test.ts`.

## Configurable URLs: url.seoRoutes

```ts
// config.server.ts
url: {
  prefix: '/:siteId/:localeId',
  seoRoutes: {
    RefArchGlobal: { product: { prefix: 'p' }, category: { prefix: 'c', mode: 'id-suffix' } },
  },
}
```

Key rules (full playbook in [references/SEO-ROUTES.md](references/SEO-ROUTES.md)):

- Build-time: changing `seoRoutes` requires a rebuild and redeploy (restart the dev server locally).
- Every active site needs an entry, or URL generation throws / the build fails.
- Business Manager URL settings are the source of truth; `seoRoutes` is a manual copy that must be kept in sync.
- Do not rename route files. Routes are already generic; the config maps prefixes.
- Build links with the semantic builders, never hardcoded `/product/...` strings:

```tsx
import { createProductUrl, createCategoryUrl } from '@/route-paths';
import { useSeoUrlContext } from '@/hooks/use-seo-url-context';

const ctx = useSeoUrlContext();
<Link to={createProductUrl({ productId, slug }, ctx)} />
```

`seoFallback.sites` in config supplies per-site fallback behavior when a SEO URL cannot be resolved; see `docs/README-MULTI-SITE.md`.

## Multi-domain and base path

- Origin for canonicals comes from `getAppOrigin` (honors forwarded host, falls back to `EXTERNAL_DOMAIN_NAME`). Each custom domain must be attached to the Managed Runtime environment. See [references/MULTI-DOMAIN-BASE-PATH.md](references/MULTI-DOMAIN-BASE-PATH.md).
- Mapping domains to sites uses an `X-Site-Id` header set by your CDN.
- A base path (`MRT_ENV_BASE_PATH`, set from the push config) prefixes asset and route URLs; use `getBasePath()` rather than hardcoding.

## Crawlers

Crawlers receive full HTML rendering; category pages stay crawlable through a `?page=N` parameter with rel prev/next links, while the canonical stays the base category URL. Verify with `curl` and a crawler user agent. Check `docs/README-SEO.md` "Crawler Rendering and Pagination" before changing streaming behavior.

## Related Skills

- `storefront-next:sfnext-routing` - route modules and URL patterns
- `storefront-next:sfnext-configuration` - config.server.ts and env overrides
- `storefront-next:sfnext-i18n` - locales, hreflang inputs
- `storefront-next:sfnext-hybrid-storefronts` - URLs owned by another storefront
- `storefront-next:sfnext-security` - CSP nonce for JSON-LD
- `storefront-next:sfnext-performance` - streaming vs crawler rendering
