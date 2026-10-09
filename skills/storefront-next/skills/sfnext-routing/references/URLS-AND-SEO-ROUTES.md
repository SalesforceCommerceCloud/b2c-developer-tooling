# Site prefixes, excluded routes and SEO aliases

Configuration lives under `app.url` in `config.server.ts`. Full reference: `docs/README-CONFIG-OPTIONS.md` and `docs/README-MULTI-SITE.md` in your project.

| Key | Effect |
|---|---|
| `url.prefix` | path pattern wrapped around every page route; default `/:siteId/:localeId` |
| `url.excludeRoutes` | globs that skip the prefix; default `['/resource/**', '/action/**']` |
| `url.seoRoutes` | per-site product and category URL grammars (slug segments, category modes, redirects) |

## Rules

- Define page paths without the prefix (as in `src/route-paths.ts`). The `Link` wrapper, `useNavigate` and `buildUrlFromContext` add it.
- Never concatenate `/${siteId}/${locale}` by hand.
- Keep `_app.p.$.tsx` and `_app.c.$.tsx` as splat routes; `seoRoutes` aliases resolve through them. Do not rename them.
- Build product and category links with `createProductUrl`, `createCategoryUrl` and `createCategoryNavigationUrl` from `@/route-paths`, passing the SEO URL context (`useSeoUrlContext` in `@/hooks/use-seo-url-context`), so slugs and prefixes stay consistent.
- A loader that resolves a product or category from the URL should use the resolvers under `@/lib/seo/` (see `_app.p.$.tsx`: `resolveProductRoute` from `@/lib/seo/url-resolution.server`) instead of parsing `params` directly.
- For SEO URL strategy and Business Manager alignment see `storefront-next:sfnext-seo`.

## Callbacks that cannot carry a prefix

SLAS redirects back to a fixed URL. Register such routes by hand in `src/routes.ts`: add the file to `IGNORED_ROUTE_FILES` and append `route('/your-callback', 'routes/your-file.ts')` after `flatRoutes(...)`, exactly as the two existing SLAS callbacks do. Then register the full URL in SLAS (see `storefront-next:sfnext-authentication`).
