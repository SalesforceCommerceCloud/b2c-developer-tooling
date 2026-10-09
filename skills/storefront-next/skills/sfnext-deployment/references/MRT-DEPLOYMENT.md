# Managed Runtime Deployment Reference

## What MRT provides

Server-side rendering on Node 24, a CDN in front of the SSR function and static bundle assets, separate environments (for example development, staging, production), and versioned bundles that can be re-deployed. Project, environment, member, redirect, and certificate management is done with `b2c mrt ...` (`b2c-cli:b2c-mrt`) or Runtime Admin.

## Push flow

```
pnpm build  ->  build/
pnpm push   ->  sfnext push: creates a bundle from build/, uploads it to the project
            ->  with a target env (MRT_TARGET / -e): deploys it; with --wait: blocks until done
```

Precedence for project and environment: CLI flag, then `MRT_PROJECT` / `MRT_TARGET`, then `SFCC_MRT_PROJECT` / `SFCC_MRT_ENVIRONMENT`, then `dw.json` (`mrtProject`, `mrtEnvironment`). Credentials: `--api-key` / `MRT_API_KEY`, or `--credentials-file` / `MRT_CREDENTIALS_FILE`, or `~/.mobify`.

Send extra flags through pnpm with `--`: `pnpm push -- --wait -e production`.

## What push sends to MRT

- The bundle (server build + client assets).
- SSR parameters from `config.server.ts` `runtime.ssrParameters` (`ssrFunctionNodeVersion`, `envBasePath`) and `runtime.ssrOnly` / `ssrShared`.

It does not send `.env` values or cartridges.

## Environment variables

Set per environment in Runtime Admin or with the b2c CLI (`pnpm config:push-env`, `b2c mrt env var set|push|list|delete`). Changes to variables apply to that environment; confirm the behavior in Runtime Admin for your project. Server-only secrets (`COMMERCE_API_SLAS_SECRET` for private clients, `GUEST_ORDER_LOOKUP_COOKIE_SECRET`, `MARKETING_CLOUD_*`) go in unprefixed. `PUBLIC__` variables are merged into config and visible in the browser. Limits: see Salesforce's [constraints](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html#constraints).

Example of per-environment application variables (values are yours):

```bash
PUBLIC__app__commerce__api__clientId=<slas-client-id>
PUBLIC__app__commerce__api__organizationId=f_ecom_<realm>_<instance>
PUBLIC__app__commerce__api__shortCode=<short-code>
PUBLIC__app__defaultSiteId=<site-id>
PUBLIC__app__commerce__sites='[{"id":"<site-id>","defaultLocale":"en-US","defaultCurrency":"USD","supportedLocales":[{"id":"en-US","preferredCurrency":"USD"}],"supportedCurrencies":["USD"]}]'
```

## Domains, base path, cookies

- Many domains on one environment: register each as an external hostname in Runtime Admin, add SLAS redirect URIs per domain, configure `images.realmHostMappings`. The public origin is resolved per request from `X-Forwarded-Host`.
- Several storefronts under one domain: give each environment a distinct `runtime.ssrParameters.envBasePath` (`/shop-a`); the CDN routes on the first path segment; the value reaches MRT via `pnpm push`.
- Shared cookies across subdomains: `app.cookies.domain` plus Business Manager Hybrid Auth cookie-domain level `2`.

Details: `storefront-next:sfnext-configuration` `references/MULTI-SITE-URLS.md`. If the domain is also fronted by eCDN, manage zones and rules with `b2c-cli:b2c-ecdn`.

## Rollback

Each push creates a bundle. To return to an earlier version, list bundles and deploy one to the environment: `b2c mrt bundle history -p <project> -e <env>` and `b2c mrt bundle deploy <bundleId> -p <project> -e <env>`. Cartridge changes roll back separately by activating a previous code version (`b2c-cli:b2c-code`).

## Verifying a deployment

1. Home, category, product, cart, and checkout pages render.
2. Products and prices load (SCAPI connectivity, correct site).
3. Login/logout, including social or passwordless if enabled.
4. A Page Designer page renders and the cartridge/code version is current.
5. Response headers (CSP) and cookies have the expected `Domain` (`curl -sI`).
6. Logs show no repeated `[Config Warning]` lines about ignored variables.
