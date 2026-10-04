---
name: sfnext-configuration
description: >-
  Configure a Storefront Next app: config.server.ts (defineConfig, metadata/runtime/app), AppConfig types in
  src/types/config.ts, PUBLIC__ environment variable overrides, getConfig(context) / useConfig(), extension config
  (app.extension, app.serverExtension), protected paths, server-only secrets, and multi-site settings
  (commerce.sites, url.prefix, seoRoutes, siteAliasMap, cookie domain). Use when editing config.server.ts, adding a
  config value, an env var is ignored or "not applied", `pnpm config:inspect` / `config:push-env`, "Ignoring
  environment variable" warnings, protected config path errors, setting up a second site or locale URLs, or
  going through the pre-launch config checklist.
  Do not use for creating a project or the npm script list (use `storefront-next:sfnext-project-setup`), pushing
  bundles or MRT env management (use `storefront-next:sfnext-deployment` / `b2c-cli:b2c-mrt`), or hybrid
  proxy and cookie-sharing with SFRA (use `storefront-next:sfnext-hybrid-storefronts`).
---

# Storefront Next Configuration

All app settings live in one typed file, `config.server.ts`. Environment variables override its values per environment; `defineConfig()` deep-merges them at startup. Full references ship in the project: `docs/README-CONFIG.md` (required/optional variable tables) and `docs/README-CONFIG-OPTIONS.md` (every option).

## Model

`config.server.ts` default-exports `defineConfig<Config>({ metadata, runtime, app }, { protectedPaths })`, imported from `@salesforce/storefront-next-runtime/config`.

| Section | Visible to | Contents |
| --- | --- | --- |
| `app` | Server and browser (`window.__APP_CONFIG__`) | Commerce API, sites, features, URL/SEO routes, images, security, engagement |
| `runtime` | Server only | MRT settings such as `ssrParameters` (`ssrFunctionNodeVersion`, `envBasePath`), `ssrOnly`, `ssrShared` |
| `metadata` | Server only | Project name/slug |

Because `app` reaches the browser, never put secrets in it.

## Add a config value

1. Add the field to `AppConfig` in `src/types/config.ts` (`Config = BaseConfig<AppConfig>`; the `AppConfigShape` / `ClientFacingAppConfigShape` augmentations in that file give `getConfig` and `useConfig` their types).
2. Set a default under `app` in `config.server.ts`. **Define the key even if the default is empty (`''`, `[]`)**; env overrides are only accepted for paths that exist here.
3. Override per environment: `PUBLIC__app__myFeature__enabled=true`.
4. Run `pnpm typecheck`.

```typescript
// src/types/config.ts (inside AppConfig)
myFeature: { enabled: boolean; maxItems: number };

// config.server.ts (inside app)
myFeature: { enabled: false, maxItems: 10 },
```

## Read config

```typescript
import { getConfig, useConfig } from '@salesforce/storefront-next-runtime/config';

// Loaders, actions, middleware (server): context is REQUIRED
export function loader({ context }: LoaderFunctionArgs) {
  const config = getConfig(context);      // full AppConfig incl. serverExtension
  return { max: config.myFeature.maxItems };
}

// Components
const config = useConfig();               // client-facing shape (no serverExtension)
```

- `getConfig()` with no argument is for browser-only modules (reads `window.__APP_CONFIG__`); it returns the client-facing shape. Calling it on the server without a context **throws** "Configuration not available".
- Routes have no `clientLoader` (forbidden by the project rules), so server code always passes `context`.
- Middleware can read `context.get(appConfigContext)` (exported from the same module).
- In tests use `mockConfig`, `mockBuildConfig`, `ConfigWrapper`, `createConfigWrapper` from `@/test-utils/config`.

## Environment variable rules

```
PUBLIC__app__<path>__<to>__<key>=value   ->   config.app.<path>.<to>.<key>
```

| Rule | Detail |
| --- | --- |
| `PUBLIC__` prefix | Merged into config and **exposed to the browser**. Client IDs, flags, site lists only |
| No prefix | Server-only; not part of config. Read with `process.env` in server code |
| Path must exist | An unknown path is skipped with `[Config Warning] Ignoring environment variable ...` in the server log, so a typo is silent to the user |
| Parsing | Numbers, `true`/`false` (as strings), JSON arrays/objects; empty value becomes `''` |
| Precedence | Deeper (more specific) paths win over a JSON blob at a parent path |
| Case | Path matching is case-insensitive |
| Depth | Max 10 segments; use a JSON value for deeper structures |
| Restart | `.env` is read at startup; restart `pnpm dev` |

### Required variables

Only three are required to boot (`.env` locally; MRT environment variables when deployed):

```bash
PUBLIC__app__commerce__api__clientId=...
PUBLIC__app__commerce__api__organizationId=...
PUBLIC__app__commerce__api__shortCode=...
```

Do not set `PUBLIC__app__commerce__api__siteId`; that path does not exist and is ignored with a warning. To point at your own site, set `PUBLIC__app__defaultSiteId` and `PUBLIC__app__commerce__sites` (see [MULTI-SITE-URLS.md](references/MULTI-SITE-URLS.md)). Everything else is optional; see [ENV-VARIABLES.md](references/ENV-VARIABLES.md).

### Debug "my env var is not applied"

```bash
pnpm config:inspect                 # shows each value and whether it comes from config.server.ts, .env, or MRT
pnpm sfnext config inspect --project my-project --environment staging   # include MRT env values
pnpm config:push-env                # push .env variables to an MRT environment (b2c mrt env var push)
```

The `config:inspect` script echoes a tip after the command, so call `sfnext config inspect` directly when passing flags.

Checklist: `PUBLIC__` with a double underscore, path exists in `config.server.ts`, booleans are the string `true`, dev server restarted, variable set on the right MRT environment, and the path is not protected.

## Protected paths

`defineConfig(..., { protectedPaths })` locks paths against env override. Setting a protected path, or a parent of one (e.g. `PUBLIC__app__url`), **throws at startup**. The template protects:

- `app__url__prefix`, `app__url__excludeRoutes`, `app__url__seoRoutes` (compiled into routes at build time; change `config.server.ts` and rebuild/redeploy)
- `app__engagement__adapters__einstein`, `...__data360`, `...__activeData__enabled`, `...__activeData__eventToggles`

The rest of `app.engagement` is overridable. Check the `protectedConfigPaths` export in your `config.server.ts` for the current list.

## Secrets

Server-only values are plain env vars read via `process.env` in server routes/middleware, never through config:

- `COMMERCE_API_SLAS_SECRET`: only for a private SLAS client (`commerce.api.privateKeyEnabled`). A public client needs no secret.
- `GUEST_ORDER_LOOKUP_COOKIE_SECRET`: required when guest order lookup is enabled.
- `MARKETING_CLOUD_*`: only for email-mode passwordless/reset with your own Marketing Cloud tenant.

Extension `config.ts` / `server-config.ts` must not read `process.env` (an AST check fails discovery).

## Extension config

Extensions add config without touching core files:

- `src/extensions/<name>/config.ts` (default-export an object) is merged into `app.extension.<camelCaseFolder>`; override with `PUBLIC__app__extension__<key>__<setting>`.
- `src/extensions/<name>/server-config.ts` is merged into `app.serverExtension.<camelCaseFolder>`, available only through `getConfig(context)`; no env override, and the build fails if a client chunk imports it.
- `pnpm config:aggregate-extensions` regenerates the merged files (run automatically by `dev`, `build`, `typecheck`).

## Multi-site and URLs

Short version: the current site comes from the request (site-context middleware), not from `commerce.sites[0]`. Use `useSite()` from `@salesforce/storefront-next-runtime/site-context` in components and `context.get(siteContext)` (same module) on the server. URL shape, `seoRoutes`, aliases, MRT Data Store sites, cookie domain, multiple domains, and base path are in [MULTI-SITE-URLS.md](references/MULTI-SITE-URLS.md).

## Pre-launch config gate

Before going live, review these defaults in `config.server.ts`:

1. `app.engagement.adapters` (Einstein, Active Data, Data 360): defaults carry **demo IDs/hosts**. Enable only with your own values, or disable them; also confirm consent categories.
2. `images.host` defaults to the DIS **staging** host (`edge.disstg...`); use the production DIS host, and add `realmHostMappings` for custom domains.
3. `.env` / MRT variables point at your own client ID, organization ID, short code, and site(s), not the demo backend.
4. `commerce.sites`, `defaultSiteId`, and `siteAliasMap` match your Business Manager sites; `url.seoRoutes` has an entry for every active site if enabled.
5. Cookie domain (`cookies.domain`) matches Business Manager Hybrid Auth level if used.
6. Security headers / CSP (`app.security.headers`) and Turnstile keys are reviewed (`storefront-next:sfnext-security`).

## Related Skills

- `storefront-next:sfnext-project-setup` - Create the project, `.env` basics, scripts
- `storefront-next:sfnext-deployment` - Push bundles and sync MRT env vars
- `storefront-next:sfnext-routing` - Site-aware links and SEO route behavior
- `storefront-next:sfnext-i18n` - Locales, translations, locale switching
- `storefront-next:sfnext-extensions` - Extension authoring
- `storefront-next:sfnext-hybrid-storefronts` - Hybrid proxy and shared cookies with SFRA
- `storefront-next:sfnext-security` - Security headers, CSP, Turnstile
- `b2c-cli:b2c-mrt` - MRT environment variable management

## Finding more

Project `docs/README-CONFIG.md`, `docs/README-CONFIG-OPTIONS.md`, `docs/README-MULTI-SITE.md`; `b2c docs search "<topic>" --category sfnext`.
