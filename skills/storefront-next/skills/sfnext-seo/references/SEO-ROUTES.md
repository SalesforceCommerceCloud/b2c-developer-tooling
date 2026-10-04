# Adopting url.seoRoutes

Source: `docs/migrations/seo-url-rules/README.md` and `docs/README-MULTI-SITE.md` (URL Config) in your project. Trust the code if they differ; verify `apply-seo-url-config` behavior in `@salesforce/storefront-next-dev`.

## What it changes

Without `seoRoutes` the storefront serves the built-in `/product/{id}` and `/category/{id}` grammar. With it, each site gets its own product and category prefix (for example `/p/{slug}/{id}`), matching Business Manager URL settings.

## Checklist before enabling

1. Runtime and dev packages are on a release that supports `seoRoutes` (see `docs/COMPATIBILITY.md`).
2. Every active site has an entry in `url.seoRoutes`; a missing site fails.
3. Decide the category mode per site: `id-suffix` (slug plus trailing category id) or slug-path (pure slug hierarchy).
4. Protect routes that must not be captured by a product/category prefix with `protectedPaths` (build-time option described in the URL Config section).
5. Leaf routes vs segments: check how the build validates overlapping prefixes.
6. Keep Business Manager URL settings identical; there is no automatic sync.

## Avoid breaking indexed URLs

- Keep old URL shapes redirecting to the new canonical ones; `redirectToCanonicalPath` only normalizes trailing slashes, so test old `/product/{id}` URLs explicitly.
- Audit hardcoded links; replace them with `createProductUrl` / `createCategoryUrl` and `useSeoUrlContext()`.
- Legacy category paths can be converted with `createCategoryUrlFromLegacyPath` in `@/route-paths`.
- Deploy, then crawl canonical, hreflang, and JSON-LD URLs for consistency.

## Hybrid deployments

If part of the catalog is served by another storefront, the storefront only owns the URLs routed to it; see `storefront-next:sfnext-hybrid-storefronts` and `docs/README-HYBRID-PROXY.md`.

## Verifying

Run `pnpm typecheck && pnpm test`, then request a product and category URL for each site and check the canonical `<link>`.
