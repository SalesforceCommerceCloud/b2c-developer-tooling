---
name: sfnext-overview
description: >-
  Start here for any Salesforce Commerce Storefront Next (sfnext) task: a router that maps what you want to do to the right storefront-next skill, says to read your project's AGENTS.md and docs/README-*.md first, and carries a cheat sheet for the sfnext CLI, the b2c CLI, the b2c-dx-mcp tools, and the docs search fallback. Use when starting work in a Storefront Next project, when unsure which skill applies, when asked "how do I do X in Storefront Next", "what commands exist", or "where is the documentation". Do not use once a specific area is clear; go straight to that skill (for example `storefront-next:sfnext-routing` or `storefront-next:sfnext-seo`).
---

# Storefront Next Overview and Router

## Before anything else

1. Read `AGENTS.md` at your project root. It is the source of truth for project structure, commands, and conventions; skills never override it.
2. Check `docs/README-*.md` (one per topic) and `instructions/*.mdc` in the project. Prefer them over memory.
3. Versions and compatibility: `docs/COMPATIBILITY.md` and `package.json#storefrontNext`.
4. Requirements: Node >= 24, pnpm >= 10.28.

## Which skill for which task

| I want to... | Skill |
|---|---|
| Create a project, install, run locally, pick a starter theme | `storefront-next:sfnext-project-setup` |
| Change `config.server.ts`, env overrides, feature flags, multi-site config | `storefront-next:sfnext-configuration` |
| Build a bundle, push to Managed Runtime, deploy cartridges, env vars | `storefront-next:sfnext-deployment` |
| Add or change a route, loader, action, URL pattern | `storefront-next:sfnext-routing` |
| Fetch data, SCAPI calls in loaders, streaming, Suspense | `storefront-next:sfnext-data-fetching` |
| Control loader revalidation and caching after actions | `storefront-next:sfnext-revalidation` |
| Client state, contexts, stores | `storefront-next:sfnext-state-management` |
| Speed, bundle size, Lighthouse, web vitals | `storefront-next:sfnext-performance` |
| Login, SLAS, guest/registered sessions, passkeys, social login | `storefront-next:sfnext-authentication` |
| Add or inspect SCAPI endpoints and clients (including custom APIs) | `storefront-next:sfnext-scapi` |
| Serve some routes from another storefront (hybrid proxy) | `storefront-next:sfnext-hybrid-storefronts` |
| Build or modify UI components | `storefront-next:sfnext-components` |
| Design tokens, Tailwind, styling | `storefront-next:sfnext-theming` |
| Page Designer components and regions | `storefront-next:sfnext-page-designer` |
| Author or install extensions, UITargets | `storefront-next:sfnext-extensions` |
| Translations, locales, language switching | `storefront-next:sfnext-i18n` |
| Unit, component, Storybook and e2e tests | `storefront-next:sfnext-testing` |
| CSP, security headers, bot protection | `storefront-next:sfnext-security` |
| Analytics adapters, consent banner, attribution | `storefront-next:sfnext-analytics-consent` |
| Meta tags, JSON-LD, canonical URLs, seoRoutes | `storefront-next:sfnext-seo` |
| Shopper Context, order management, guest order lookup, email cartridge, shipped extensions | `storefront-next:sfnext-commerce-features` |
| Lint, typecheck, pre-merge checks | `storefront-next:sfnext-quality-gates` |
| Accessibility checks and fixes | `storefront-next:sfnext-accessibility` |

Figma-to-Page-Designer work lives in the separate `figma-to-sfnext-pagedesigner` plugin.

## sfnext CLI cheat sheet

Installed with the project (`@salesforce/storefront-next-dev`). Prefer the `package.json` scripts, which wrap these.

| Command | Purpose |
|---|---|
| `sfnext create-storefront` | Scaffold a project (`--vertical` picks the starter theme) |
| `sfnext dev` / `sfnext preview` | Dev server / preview of the built app |
| `sfnext create-bundle`, `sfnext push` | Build and push a bundle to Managed Runtime |
| `sfnext prepare-local` | Prepare a local build |
| `sfnext generate-cartridge`, `validate-cartridge`, `deploy-cartridge` | Cartridge build, check, upload |
| `sfnext setup-base-cartridge` | Register the SLAS scope for the base cartridge |
| `sfnext create-instructions` | Generate extension install instructions |
| `sfnext config inspect`, `config aggregate-extensions` | Show resolved config; merge extension config |
| `sfnext extensions create|install|list|remove` | Manage extensions |
| `sfnext scapi add|available|list|remove` | Manage SCAPI client wiring |
| `sfnext locales aggregate-extensions` | Merge extension locale files |

Run `sfnext <command> --help` for flags; check your project's `package.json` scripts for the exact invocations.

## b2c CLI cheat sheet

Use `b2c` (`npx @salesforce/b2c-cli` if not installed) for platform work around the storefront:

| Need | Command family |
|---|---|
| Managed Runtime projects, envs, env vars, bundles, logs | `b2c mrt ...` (skill `b2c-cli:b2c-mrt`) |
| Deploy or watch cartridges on an instance | `b2c code deploy`, `b2c code watch` |
| SCAPI schemas and custom APIs | `b2c scapi schemas ...`, `b2c scapi custom ...` |
| SLAS clients | `b2c slas ...` (skill `b2c-cli:b2c-slas`) |
| Instance and site data, WebDAV, jobs, logs | `b2c sites`, `b2c webdav`, `b2c job`, `b2c logs` |
| Documentation | `b2c docs search`, `b2c docs read` |

## MCP tools (b2c-dx-mcp, STOREFRONTNEXT toolset)

`mrt_bundle_push`, `mrt_logs_watch`, `scapi_search`, `scapi_execute`, `scapi_snippet_save`, `scapi_schemas_list`, `scapi_custom_apis_get_status`, plus the docs tools `docs_search`, `docs_read`, `docs_list`, `docs_schema_search`, `docs_schema_read`, `docs_schema_list`. Availability depends on how the MCP server was started; list tools in your client.

## Docs search fallback

When the project docs and skills do not answer it, search the Storefront Next developer guides:

```bash
b2c docs search "storefront next getting started" --category sfnext
b2c docs read <id-from-results>
```

MCP equivalent: `docs_search` with the storefront category, then `docs_read`. Workspace detection also boosts Storefront Next results automatically in a project. See `b2c-cli:b2c-docs`.

## Related Skills

- `storefront-next:sfnext-project-setup` - usual next step for new work
- `storefront-next:sfnext-configuration` - config and env
- `storefront-next:sfnext-routing` - routes and loaders
- `storefront-next:sfnext-quality-gates` - checks before you finish
- `b2c-cli:b2c-docs` - documentation search
- `b2c-cli:b2c-mrt` - Managed Runtime
