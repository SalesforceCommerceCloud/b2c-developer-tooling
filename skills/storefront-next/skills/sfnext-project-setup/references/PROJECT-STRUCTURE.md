# Project Structure

A short map of a Storefront Next project. The project's `AGENTS.md` ("Project Structure") is authoritative and kept current; use `ls` on the project rather than trusting any long listing, including this one.

## Top level

| Path | Purpose |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md` | Rules and doc index for coding agents |
| `config.server.ts` | Typed defaults for the whole app (`metadata`, `runtime`, `app`). Edited by you; overridden per environment with `PUBLIC__` env vars |
| `config-meta.json`, `config-metadata/` | Values `sfnext create-storefront` prompts for; config metadata |
| `.env.default` / `.env` | Required credentials and MRT target. Only `.env` is read |
| `package.json` | Scripts, dependencies, and `storefrontNext` (`templateRelease`, `templateVersion`, `minSdkVersion`) |
| `react-router.config.ts`, `vite.config.ts`, `vite-plugins/` | Framework and build config; plugins for bundle size, env validation, hybrid proxy, server-only-config guard |
| `components.json` | shadcn config (CSS entry is `src/theme/index.css`) |
| `cartridges/app_storefrontnext_base/` | Base cartridge; Page Designer metadata is generated into it |
| `docs/` | `README-*.md` guides, `COMPATIBILITY.md`, `migrations/` upgrade guides |
| `instructions/` | Install/uninstall instructions for extensions (`.mdc`) |
| `e2e/` | Playwright end-to-end and accessibility suite (its own package) |
| `scripts/` | Helper scripts behind `lint:a11y`, `lint:css`, `bundlesize:compare`, `storybook:test`, `extensions:list`, ... |
| `.storybook/`, `.github/`, `.devcontainer/`, `.claude/skills/sync-shadcn` | Storybook, CI workflows, dev container, in-project skill for syncing shadcn primitives |
| `public/` | Static assets (fonts, images, robots.txt, favicon) |

## `src/`

| Path | Notes |
| --- | --- |
| `routes/` | Flat file routes. Families: `_app.*` (storefront shell), `_checkout.*`, `_empty.*` (login, signup, maintenance; minimal chrome), `action.*` (server mutations), `resource.*` (resource routes). Products and categories are splats: `_app.p.$.tsx`, `_app.c.$.tsx`. Orders use `$orderNo`. See `storefront-next:sfnext-routing` |
| `routes.ts`, `route-paths.ts` | Route registration and typed path helpers (`routeHref`) |
| `root.tsx`, `entry.client.tsx`, `entry.server.tsx`, `app-wrapper.tsx` | App shell and entry points. `root.tsx` imports `src/theme/index.css` |
| `components/` | Feature components; `components/ui/` holds UI primitives you own; `components/link` is the site-aware `Link`/`NavLink` |
| `hooks/` | Includes `use-navigate` and `use-current-site-and-locale-ref` |
| `providers/` | React context providers |
| `lib/` | Domain folders (`auth/`, `cart/`, `checkout/`, `product/`, `order/`, ...), `api-clients.server.ts` (`createApiClients(context)`), `url.server.ts` (`buildUrlFromContext`), `page-designer/` (registry, loader), `decorators/`, `revalidation/` |
| `middlewares/` | Server middlewares (`app-config`, `site-context`, `i18next`, `auth`, `basket`, `security-headers`, `logging`, ...). Ordering is in `src/server/middleware-registry.ts` |
| `scapi/` | Generated and custom SCAPI clients (`@/scapi` barrel); see `storefront-next:sfnext-scapi` |
| `extensions/` | Optional feature modules; `config.json` is the extension registry; per-extension `config.ts` / `server-config.ts` feed app config |
| `targets/` | UI target (extension point) system |
| `theme/` | `index.css` entry, `base.css`, `tailwind.css`, `tokens/`, `overrides/`, `animations.css`; see `storefront-next:sfnext-theming` |
| `locales/` | One folder per language-region (`en-US`, `de-DE`, ...) with `translations.json`; see `storefront-next:sfnext-i18n` |
| `types/config.ts` | `AppConfig` / `Config` types and the `getConfig` / `useConfig` type augmentation |
| `analytics/`, `design-system/`, `test-utils/` | Tracking components, design-system docs stories, shared test helpers (`@/test-utils/config`, `context-provider`, `request-helpers`, ...) |

## Where to look for each concern

| Concern | Start here |
| --- | --- |
| Data loading, Suspense, state, images | `AGENTS.md` "Performance & Data Rules", `docs/README-DATA.md`, `README-SUSPENSE.md`, `README-STATE.md` |
| All config options | `docs/README-CONFIG.md` (required/optional tables), `docs/README-CONFIG-OPTIONS.md` |
| Multi-site, locale URLs, SEO routes | `docs/README-MULTI-SITE.md` |
| Auth and cookies | `docs/README-AUTH.md` |
| Page Designer | `docs/README-PAGE-DESIGNER.md` |
| Upgrading | `docs/COMPATIBILITY.md`, `docs/migrations/` |

## Page Designer metadata

Component metadata is generated from decorators by `pnpm cartridge:generate` (also run by `pnpm build`) into `cartridges/app_storefrontnext_base/`, validated with `pnpm cartridge:validate`, and deployed to the B2C instance with `pnpm cartridge:deploy` (not part of `pnpm push`). See `storefront-next:sfnext-deployment` and `storefront-next:sfnext-page-designer`.

## Adding UI primitives

The project ships an in-project `sync-shadcn` skill (`.claude/skills/sync-shadcn`) and `scripts/upgrade-shadcn.js` for pulling updated shadcn primitives into `src/components/ui/` without losing local changes. Prefer that over a raw `npx shadcn add`.
