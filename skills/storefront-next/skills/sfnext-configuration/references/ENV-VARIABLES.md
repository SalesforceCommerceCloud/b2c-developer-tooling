# Environment Variables

Authoritative, current tables ship in the project: `docs/README-CONFIG.md` ("Required vs Optional Variables") and `docs/README-CONFIG-OPTIONS.md`. This file summarizes the categories; check those docs for defaults.

## Where variables come from

| Source | Used by |
| --- | --- |
| `.env` in the project root | `pnpm dev`, `pnpm start`, and `sfnext` commands (`push`, `config inspect`, ...). `.env.default` is a template only and is never loaded |
| Managed Runtime environment variables | The deployed storefront. Set in Runtime Admin or with `b2c mrt env var set` / `b2c mrt env var push` (`pnpm config:push-env`) |

`.env` is not uploaded by `pnpm push`. See `storefront-next:sfnext-deployment`.

## Required to run

`PUBLIC__app__commerce__api__clientId`, `PUBLIC__app__commerce__api__organizationId`, `PUBLIC__app__commerce__api__shortCode`.

## Required to push to Managed Runtime

| Variable | Notes |
| --- | --- |
| `MRT_PROJECT` | MRT project slug (also `--project`, `SFCC_MRT_PROJECT`, or dw.json `mrtProject`). Set it explicitly |
| `MRT_TARGET` | Target environment (also `--environment`). Optional unless using `--wait` |
| `MRT_API_KEY` | API key (or `MRT_CREDENTIALS_FILE` / `~/.mobify`). Also `MRT_CLOUD_ORIGIN` for a non-default MRT origin |

These are read by the `sfnext` CLI; they are not storefront runtime config.

## Common optional `PUBLIC__` overrides

| Variable | Effect |
| --- | --- |
| `PUBLIC__app__defaultSiteId` | Default site ID |
| `PUBLIC__app__commerce__sites` | JSON array of site definitions |
| `PUBLIC__app__commerce__sitesFromDal` | `false` keeps static `commerce.sites` authoritative instead of MRT Data Store sites |
| `PUBLIC__app__cookies__domain` | Cookie domain for all storefront cookies |
| `PUBLIC__app__commerce__api__privateKeyEnabled` | Use a private SLAS client (needs `COMMERCE_API_SLAS_SECRET`) |
| `PUBLIC__app__commerce__api__proxy`, `...__callback` | SCAPI proxy and OAuth callback paths |
| `PUBLIC__app__hybrid__enabled` | Hybrid mode |
| `PUBLIC__app__features__*` | Feature toggles (passwordless login, social login, shopper context, MRT-based Page Designer resolution, ...) |
| `PUBLIC__app__security__turnstile__*` | Turnstile bot protection |
| `PUBLIC__app__commerce__shopperAgent` | Shopper Agent widget config (the older `PUBLIC__app__cimulateAgent` is deprecated) |
| `PUBLIC__app__extension__<key>__<setting>` | Extension config overrides |

## Server-only (no prefix)

`COMMERCE_API_SLAS_SECRET` (private client only), `GUEST_ORDER_LOOKUP_COOKIE_SECRET`, `MARKETING_CLOUD_CLIENT_ID` / `_CLIENT_SECRET` / `_AUTH_BASE_URL` / `_REST_BASE_URL`, `SFCC_LOG_LEVEL` (`error|warn|info|debug`), and local-dev hybrid proxy variables (`HYBRID_PROXY_ENABLED`, `HYBRID_ROUTING_RULES`, `HYBRID_PROXY_LOCALE`, `SFCC_ORIGIN`; see `storefront-next:sfnext-hybrid-storefronts`).

## Gotchas

- Unknown `PUBLIC__` paths are ignored with a server-log warning; define the key in `config.server.ts` first (an empty default is enough).
- Protected paths (`app__url__*`, selected engagement adapter paths) throw if set via env; see SKILL.md.
- Booleans must be the string `true`/`false`. Objects and arrays are JSON strings.
- Multi-line JSON is supported in `.env`; on MRT, keep values compact.
- MRT limits total variable size and name length; see Salesforce's [Environment Variables constraints](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html) for the current numbers rather than relying on a figure here.
- Vite also loads `.env.<mode>` files by build mode.
