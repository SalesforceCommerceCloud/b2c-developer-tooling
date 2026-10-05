---
name: sfnext-deployment
description: >-
  Build and deploy a Storefront Next storefront: `pnpm build`, `pnpm push` / `sfnext push` to Managed Runtime (MRT),
  MRT credentials (MRT_API_KEY, MRT_PROJECT, MRT_TARGET), syncing env vars with `pnpm config:push-env`, deploying
  the base cartridge and Page Designer metadata (`pnpm cartridge:generate|validate|deploy`), the shipped GitHub
  Actions deploy workflow, bundle size checks, the pre-launch checklist, and upgrading a project (template vs SDK
  compatibility, react-router pin). Use when a push fails or is rejected, a deployed site returns 500 or shows
  stale Page Designer components, "deploy to staging/production", or before go-live.
  Do not use for generic MRT project/environment/redirect/member management or log tailing (use `b2c-cli:b2c-mrt`),
  for config.server.ts and PUBLIC__ variable rules (use `storefront-next:sfnext-configuration`), or for creating
  the project (use `storefront-next:sfnext-project-setup`).
---

# Storefront Next Deployment

A storefront ships as two independent deployments:

| Deployment | Target | Command |
| --- | --- | --- |
| App bundle (SSR server + client assets) | Managed Runtime | `pnpm build` then `pnpm push` |
| Base cartridge (Page Designer metadata, notification Custom API) | B2C Commerce instance (WebDAV code version) | `pnpm cartridge:deploy` |

If Business Manager Storefront Setup created your project, reuse its MRT project, environments, and SLAS client. Guides: [deployment](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-push-mrt-auto.html), [launch](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-launch-storefront.html).

## Build

```bash
pnpm build        # extension locales + config aggregation, cartridge:generate, react-router build -> build/
pnpm start        # preview the production build at http://localhost:3000
pnpm bundlesize   # build with bundle size limits enforced
```

Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` before pushing. Node 24 is required locally and on MRT (`runtime.ssrParameters.ssrFunctionNodeVersion: '24.x'`).

## Push to Managed Runtime

`push` does **not** build; it fails if `build/` is missing.

```bash
pnpm build && pnpm push                              # upload only (not deployed to an env unless a target is set)
pnpm push -- -m "Release 42" -e staging --wait       # deploy to an env and wait
```

| Need | Provide |
| --- | --- |
| Credentials | `MRT_API_KEY` (or `--api-key`, `--credentials-file`, `~/.mobify`); `MRT_CLOUD_ORIGIN` for a non-default MRT origin |
| Project slug | `MRT_PROJECT` / `-p` / `SFCC_MRT_PROJECT` / dw.json `mrtProject` (set it explicitly; push errors without one) |
| Target env | `MRT_TARGET` / `-e`. Required with `--wait`. Without it the bundle uploads but is not deployed |

Put `MRT_PROJECT` and `MRT_TARGET` in `.env` for local pushes. Store `MRT_API_KEY` in your shell or CI secret store, not in committed files. Flags and other commands: `storefront-next:sfnext-project-setup` `references/SFNEXT-CLI.md`. Inspect without deploying: `pnpm sfnext create-bundle -d . -o .bundle`.

Bundle history, rolling back to an earlier bundle, and environment management are generic MRT tasks: `b2c mrt bundle history|list|deploy`, see `b2c-cli:b2c-mrt`. Live logs: MCP `mrt_logs_watch` / `mrt_logs_watch_poll`, or `b2c mrt tail-logs`. MCP `mrt_bundle_push` can also push a bundle.

## Environment variables on MRT

`.env` is **not** uploaded by `push`. Set runtime config on the MRT environment:

```bash
pnpm config:push-env                                 # b2c mrt env var push: reads .env, shows a diff, asks to confirm
b2c mrt env var push -f .env.staging -p my-project -e staging --yes   # explicit file, skips prompt
b2c mrt env var set PUBLIC__app__defaultSiteId=MySite -p my-project -e staging
pnpm sfnext config inspect --project my-project --environment staging  # see what is applied
```

`push` excludes `MRT_`-prefixed keys by default. Review the file first: `PUBLIC__` values are browser-visible, and local-only values should not be pushed. Variable naming and limits: Salesforce's [environment variables guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-mrt-environment-vars.html). Rules for what to set: `storefront-next:sfnext-configuration`.

## Cartridge deployment

```bash
pnpm cartridge:generate            # Page Designer metadata from decorators (also run by pnpm build)
pnpm cartridge:validate            # validate generated JSON
pnpm cartridge:deploy              # upload cartridges/ to the instance
pnpm cartridge:deploy -- --delete --reload   # wipe old files first, then activate the code version
```

- Deployment is **not** part of `pnpm push` and is manual by default.
- Needs an instance (`-s/--server` or `SFCC_SERVER`), WebDAV credentials, and either `--code-version` or OAuth credentials to discover the active version (`--reload` also needs OAuth with OCAPI `code_versions` access). Settings resolve from flags, env, or `dw.json`; see `b2c-cli:b2c-code` for the shared auth model.
- Redeploy whenever Page Designer decorators or attribute definitions change; stale components in Business Manager mean the cartridge is behind.
- The base cartridge also hosts the notification Custom API used by passwordless login, password reset, OTP, and guest order lookup emails. Once per client, register its SLAS scope with `sfnext setup-base-cartridge --slas-client-id <id>` (`docs/README-EMAIL-CARTRIDGE.md`).

## CI/CD

The project ships `.github/workflows/deploy.yml`: on push to the `latest` branch (or manual dispatch) it builds, runs `pnpm push --wait` (needs secret `MRT_API_KEY`, variables `MRT_PROJECT`, `MRT_TARGET`), and deploys cartridges with the b2c `code-deploy` action (needs `SFCC_SERVER`, `SFCC_CLIENT_ID`, secret `SFCC_CLIENT_SECRET`). Each job skips cleanly when its configuration is absent. Read the file before changing branch names or environments.

## Pre-launch checklist

1. `pnpm typecheck && pnpm lint && pnpm test` pass; `pnpm bundlesize` within limits.
2. MRT variables set on the target env: your own client ID, organization ID, short code, site(s); `pnpm config:inspect` shows no unintended demo values.
3. Demo analytics IDs/hosts in `app.engagement.adapters` replaced or disabled.
4. `images.host` switched from the DIS staging host to production; `realmHostMappings` for custom domains.
5. Cartridge deployed and code version activated; SLAS scopes registered; Page Designer pages publish and render.
6. SLAS redirect URIs include every production domain; cookie domain and Business Manager Hybrid Auth level agree if used (`references/MRT-DEPLOYMENT.md`).
7. `url.seoRoutes` has an entry per active site if enabled (protected: needs a rebuild).
8. Security headers/CSP and Turnstile reviewed (`storefront-next:sfnext-security`); robots and sitemap handled (`storefront-next:sfnext-seo`).
9. Smoke test after deploy: home, PLP, PDP, cart, login, checkout, and a Page Designer page.

## Upgrading a project

Your project records `storefrontNext.templateRelease`, `templateVersion`, and `minSdkVersion` in `package.json`; `docs/COMPATIBILITY.md` maps template releases to the SDK (`@salesforce/storefront-next-dev` / `-runtime`) versions they need. Follow the step-by-step guides in `docs/migrations/` (for example `react-router-7.18`: pin `react-router` and every `@react-router/*` package to exactly `7.18.2`, and `seo-url-rules`). Upgrade SDK packages, run `pnpm install`, `pnpm typecheck`, and tests, then redeploy.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Build directory ... does not exist` | Run `pnpm build` before `pnpm push` |
| Push: project slug required | Set `MRT_PROJECT` (or `-p`) |
| Push: credentials required / 401 | `MRT_API_KEY` missing or for a different MRT user; check `--credentials-file` |
| `--wait` error about environment | Add `-e <env>` or `MRT_TARGET` |
| 500 after deploy | Required `PUBLIC__` variables missing on that MRT environment; `pnpm sfnext config inspect --environment <env>`; tail logs (`b2c-cli:b2c-mrt`) |
| Env var "not applied" on MRT | Key not in `config.server.ts` (ignored with a warning) or a protected path; see `storefront-next:sfnext-configuration` |
| Stale Page Designer components | Cartridge not regenerated/deployed or code version not activated |
| Build fails on client chunk importing server config | `server-config.ts` imported from client code |

## Related Skills

- `storefront-next:sfnext-project-setup` - Scripts, CLI reference, first run
- `storefront-next:sfnext-configuration` - Config and env var rules, multi-site/base path/cookie domain
- `storefront-next:sfnext-page-designer` - Decorators and cartridge metadata
- `storefront-next:sfnext-performance` - Bundle size and Lighthouse
- `storefront-next:sfnext-quality-gates` - Pre-push lint/type/test gates
- `b2c-cli:b2c-mrt` - MRT projects, environments, bundles, env vars, redirects, logs
- `b2c-cli:b2c-code` - Code version and cartridge deploy with the b2c CLI

## Finding more

Project `docs/README-BASE-PATH.md`, `README-MULTI-DOMAIN.md`, `README-COOKIE-DOMAIN.md`, `README-EMAIL-CARTRIDGE.md`, `docs/migrations/`; `b2c docs search "<topic>" --category sfnext`.
