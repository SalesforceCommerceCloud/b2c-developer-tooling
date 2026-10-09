---
name: sfnext-scapi
description: >-
  Use and extend SCAPI clients in a Storefront Next project: createApiClients, the `@/scapi` type barrel, typing `c_*` custom attributes by overriding a built-in client, and adding your own custom API end to end with `b2c sfnext scapi` (add, available, list, remove). Use for "clients.shopperProducts", "c_ attribute is not typed", "sfnext scapi add", "add custom API to the storefront", src/scapi/ generated files, custom-clients.ts, calling a loyalty/notify-style custom endpoint from a loader or action, useScapiFetcher, personalized=none for custom clients, or 404 from a custom endpoint. Do not use for writing the cartridge/schema.yaml itself (use `b2c:b2c-custom-api-development`), endpoint registration status (use `b2c-cli:b2c-scapi-custom`), loader/caching strategy (use `storefront-next:sfnext-data-fetching`), or login/session code (use `storefront-next:sfnext-authentication`).
---

# Storefront Next SCAPI Clients and Custom APIs

The runtime (`@salesforce/storefront-next-runtime/scapi`) already ships typed clients for the standard shopper APIs (products, search, baskets, customers, orders, and so on). You do not "add" those. `sfnext scapi add` does one of two things on top:

1. **Override** a built-in client (client key matches, for example `shopperProducts`) with a richer schema, typically your tenant's schema expanded with `c_*` custom attributes, so `product.c_myAttr` is typed.
2. **Add a custom API** you deployed to B2C Commerce (a new property such as `clients.loyalty`).

Which one you get is decided automatically from the client key. Deep dive: `docs/README-SCAPI.md` in your project.

## The CLI surface

Run as `b2c sfnext scapi ...`, or inside your project as `pnpm sfnext scapi ...` (the `sfnext` bin ships with the project). Add `-d <dir>` / `--project-directory` to target another directory.

| Command | What it does |
|---|---|
| `scapi available` | Probes your tenant: for each of the built-in shopper APIs counts `c_*` attributes, lists tenant custom APIs, and prints the matching `scapi add` command. Needs OAuth. No filter flags. |
| `scapi add <apiFamily> <apiName> <apiVersion>` | Pull mode: fetch the schema from the SCAPI Schemas API. Needs OAuth. |
| `scapi add --schema <file> --name <clientKey>` | Local mode: use a YAML/JSON OpenAPI file. `--name` is required here. |
| `scapi list` | Shows registered Overrides and Custom APIs (schema, base path, locale). |
| `scapi remove <clientKey>` | Removes the registration and its generated files (one positional argument: the client key, for example `loyalty`). |

`add` flags: `--name <key>` (defaults to camelCase of the API name in pull mode), `--base-path <path>` (derived from the schema `servers[].url` if omitted), `--supports-locale` / `--no-supports-locale` (overrides inherit the built-in default), `--expand-custom-properties` (default on, pull mode only; include `c_*`, use `--no-expand-custom-properties` to skip). Re-running `add` regenerates; there is no `--force` and no `--json`. There is no install step after `add`.

**Pull mode prerequisites:** SCAPI short code (`SFCC_SHORTCODE` or `--short-code`), tenant id (`SFCC_TENANT_ID` or `--tenant-id`), and an Account Manager API client allowed the `sfcc.scapi-schemas` scope (`SFCC_CLIENT_ID` and `SFCC_CLIENT_SECRET`, or `--client-id`/`--client-secret`, or `dw.json`). The legacy names `SFCC_OAUTH_CLIENT_ID` / `SFCC_OAUTH_CLIENT_SECRET` are also accepted because the CLI resolves both. If the `@salesforce/storefront-next-dev` package is in the project, `b2c` uses that local version.

```bash
# Which built-in APIs have c_ attributes on my tenant? Which custom APIs exist?
b2c sfnext scapi available

# Type c_* attributes on products (override; pulls schema with custom properties)
b2c sfnext scapi add product shopper-products v1

# Register a custom API from the tenant, or from a local file
b2c sfnext scapi add custom loyalty v1
b2c sfnext scapi add --schema ./loyalty-api.yaml --name loyalty --base-path /custom/loyalty/v1

b2c sfnext scapi list
b2c sfnext scapi remove loyalty
```

For a schema-only look without touching the project use `b2c scapi schemas get/list` (see `b2c-cli:b2c-scapi-schemas`; both need `--tenant-id`).

## What gets generated

```
src/scapi/
  index.ts            barrel (generated), the only SCAPI import surface for app code
  custom-clients.ts   registry of overrides and custom clients (generated)
  schemas/            <name>-<ver>.yaml and .meta.json
  generated/          <name>-<ver>.ts, .operations.ts, (.namespace.ts for overrides)
```

Never hand-edit these; rerun `sfnext scapi add`. Registry entries carry `key`, `basePath`, `ops`, `locale`, `orgPrefix`. Custom clients use `orgPrefix: true` (base `/custom/<name>/v1/organizations/{orgId}`); the shipped `sfnextNotify` entry is a working example.

## Import rule

Import types and clients from the barrel, not from the runtime package:

```typescript
import { ApiError, type ShopperProducts } from '@/scapi';          // picks up overrides
// import { ShopperProducts } from '@salesforce/storefront-next-runtime/scapi'; // bypasses overrides, lint warns
```

Only `src/scapi/**` and `src/lib/api-clients.server.ts` may import the runtime path directly.

## Use clients in loaders and actions

```typescript
import { createApiClients } from '@/lib/api-clients.server';

export async function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    const { data: product } = await clients.shopperProducts.getProduct({
        params: { path: { id: 'my-product-id' } },
    });
    const { data: rewards } = await clients.loyalty.getLoyaltyRewards(); // custom client
    return { product, rewardTier: product?.c_loyaltyTier, rewards };
}
```

- Calls return `{ data }` and **throw** `ApiError` on failure (wrap in `NormalizedApiError` from `@/lib/api/normalized-api-error` when you need a message/status).
- `createApiClients` automatically injects `organizationId`, `siteId` and (when the client supports it) `locale`. Do not pass `siteId` yourself.
- Auth comes from the shopper token in the auth middleware (`storefront-next:sfnext-authentication`); do not read tokens to call SCAPI manually. Get the shopper via `getAuth(context)` only when you need `customerId`.
- Prefer the existing helpers in `src/lib/api/*.server.ts` (search, products, basket, wishlist, order) for standard APIs, and put your own custom-API calls in a new `src/lib/api/<thing>.server.ts`.
- Calling from the browser: `useScapiFetcher(client, method, options)` goes through `/resource/api/client/...`, which only allows a short **allow-list** of operations (`src/lib/scapi/resource-policy.ts`), and `siteId`/`locale`/`organizationId` are server-owned. A new custom operation is not callable from the browser until you add it there; prefer a route loader/action. The `'helpers'` overload is deprecated. See `docs/README-PERFORMANCE.md` and `docs/README-REVALIDATION.md` for fetcher lifecycle rules.

## End-to-end: a new custom API

1. **Author the endpoint** (cartridge `rest-apis/<api-name>/` with `api.json`, `schema.yaml`, script) using `b2c:b2c-custom-api-development`. `api.json` maps `endpoint` to `schema` and `implementation`; auth is declared in `schema.yaml` (`ShopperToken` for storefront calls, with a `c_` scope under `security:`). The shipped `cartridges/app_storefrontnext_base/cartridge/rest-apis/sfnext-notify/` is a complete example.
2. **Deploy and activate**: `b2c code deploy <cartridge> --reload` (reload toggles activation so endpoints re-register; see `b2c-cli:b2c-code`).
3. **Confirm registration**: `b2c scapi custom status --tenant-id <id>` (filter with `--status not_registered`). Use `b2c-cli:b2c-scapi-custom` for 404s and `errorReason`.
4. **Allow the scope**: add the custom scope to the SLAS client used by the storefront (`b2c-cli:b2c-slas`). The shopper token must carry it, otherwise calls get 401/403.
5. **Register in the storefront**: `b2c sfnext scapi add custom <api-name> v1` (or `--schema` with a local copy).
6. **Call it** from a server loader/action as above; `import type` request/response types from `@/scapi`.
7. After schema changes repeat steps 2 and 5.

## Non-personalized caching

Storefront Next can add `personalized=none` to eligible GET requests through one central policy. Overrides and custom clients are **left unclassified** until you review and approve their exact transports in the policy module. Do not loosen it to `() => true`. See `docs/README-SCAPI-NON-PERSONALIZED-RESPONSES.md` before approving a client.

## Pitfalls

- Expecting `scapi add shopper-search ...` to be needed: standard clients already exist.
- Importing from `@salesforce/storefront-next-runtime/scapi` and wondering why `c_*` is untyped.
- Forgetting `--reload` after deploy, so the endpoint stays unregistered (404).
- Passing `siteId` or `locale` in `params.query`: server-owned, stripped on the resource route and injected elsewhere.
- Override key typos: the key must exactly match a built-in (`shopperProducts`, `shopperBasketsV2`, ...) or you create an unrelated custom client.
- Custom client used from the browser fetcher without allow-listing it.

Worked example of a shipped custom API: [references/WORKED-EXAMPLE.md](references/WORKED-EXAMPLE.md).

## Related Skills

- `b2c:b2c-custom-api-development` - author the cartridge, api.json, schema.yaml, scripts
- `b2c-cli:b2c-scapi-custom` - registration status and debugging 404s
- `b2c-cli:b2c-scapi-schemas` - browse SCAPI schemas
- `b2c-cli:b2c-slas` - add custom scopes to the SLAS client
- `storefront-next:sfnext-data-fetching` - loaders, actions, caching
- `storefront-next:sfnext-authentication` - `getAuth`, sessions
- `storefront-next:sfnext-revalidation` - fetcher revalidation rules
