# Multi-domain and base path effects on URLs

In-project docs: `docs/README-MULTI-DOMAIN.md`, `docs/README-BASE-PATH.md`, `docs/README-MULTI-SITE.md`.

## Multiple domains, one environment

- Attach every domain to the Managed Runtime environment (custom domains in the MRT project; see `b2c-cli:b2c-mrt`).
- The request host is read from the forwarded host header; `getAppOrigin` uses it for canonical, hreflang, and og URLs. `EXTERNAL_DOMAIN_NAME` is a fallback only.
- To choose the Commerce site per domain, have the CDN send an `X-Site-Id` header (for example `site-a.shop.com` -> `RefArch`).
- Only trust forwarded host behind your CDN; the doc has a section on trusting the forwarded host.
- Images on custom domains need `realmHostMappings`; cookies are host-only by default (see `docs/README-COOKIE-DOMAIN.md`).

## Base path

- `MRT_ENV_BASE_PATH` is set by Managed Runtime from the push configuration (`ssrParameters.envBasePath`).
- Server code reads `process.env.MRT_ENV_BASE_PATH`; client code derives it from the bundle path. Use `getBasePath()` (defined in your project's `src/lib/utils.ts`) when building URLs by hand.
- Canonical URLs must include the base path; use `buildSeoPageUrl` instead of concatenating strings.
