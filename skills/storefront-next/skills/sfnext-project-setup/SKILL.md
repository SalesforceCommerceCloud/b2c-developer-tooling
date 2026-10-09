---
name: sfnext-project-setup
description: >-
  Create and bootstrap a Storefront Next project, and learn its layout, npm scripts, and first-run workflow.
  Use when creating a new storefront, running `sfnext create-storefront` (`--vertical` starter theme, `--defaults`,
  `--template`, `--output-dir`), choosing between Business Manager Storefront Setup and the CLI, fixing
  `pnpm install` / Node 24 problems, copying `.env.default` to `.env`, asking "what does this folder do" or
  "which pnpm script do I run", or running `b2c sfnext` / `pnpm sfnext` commands for the first time.
  Do not use for config.server.ts or PUBLIC__ env var rules (use `storefront-next:sfnext-configuration`),
  building/pushing to Managed Runtime (use `storefront-next:sfnext-deployment`), or a conceptual tour of the
  architecture (use `storefront-next:sfnext-overview`).
---

# Storefront Next Project Setup

A Storefront Next project is a server-rendered React 19 / React Router 7 / Vite / Tailwind v4 app that runs on Managed Runtime (MRT). All SCAPI calls run server-side. You own the project code after it is created.

**Read the project's own `AGENTS.md` first.** It ships in every project (`CLAUDE.md` is a copy) and is the authority for data-loading, Suspense, state, image, and navigation rules. This skill never overrides it. Detailed guides live in the project's `docs/README-*.md`.

## Prerequisites

- Node.js >= 24 (`package.json` `engines`; MRT also runs Node 24)
- pnpm >= 10.28
- A B2C Commerce instance with a SLAS public client, your organization ID, and the SCAPI short code (unless you only want the bundled demo backend)

## Choose how to start

| Path | Use when |
| --- | --- |
| Business Manager **Storefront Setup** (GitHub or local-code workflow) | You want an instance-connected storefront. It creates the SLAS client, the MRT project/environments, initial config, and a first deployment. Reuse those resources; do not create replacement SLAS clients or MRT projects as routine setup. Use the downloaded `env.txt` as `.env`. Guides: [GitHub workflow](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm-github.html), [local-code workflow](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm.html) |
| `sfnext create-storefront` | You want a fresh local project from a starter theme, with your own extension selection and credentials |
| Clone / "Use this template" of a published starter repo | You prefer plain git; the project README lists the starter repositories |

Never invent tenant/site IDs and never echo secrets from `env.txt`.

## Create a project with the CLI

```bash
# Interactive: pick a starter theme, name, extensions, and credentials
pnpm dlx @salesforce/storefront-next-dev create-storefront
# or, with the b2c CLI (auto-installs the sfnext plugin on first use)
b2c sfnext create-storefront

# Non-interactive
sfnext create-storefront -n my-storefront --vertical cosmetic -o ./projects
sfnext create-storefront -n my-storefront --defaults
```

| Flag | Meaning |
| --- | --- |
| `-n, --name` | Project name |
| `-V, --vertical` | Starter theme: `fashion` (default with `--defaults`), `cosmetic`, `foundations`, `footwear`, `furniture`, `luxury` |
| `-t, --template` | Template repo URL or local path (overrides `--vertical`) |
| `-b, --template-branch` | Branch or tag to clone |
| `-d, --defaults` | Accept all defaults, no prompts (CI) |
| `-o, --output-dir` | Where to create the project |

What it does: shallow-clones the chosen starter, removes `.git`, asks which **extensions** to keep (and trims the rest; manage them later with `sfnext extensions ...`, see `storefront-next:sfnext-extensions`), prompts for the values in `config-meta.json` (SLAS client ID, organization ID, short code), and writes `.env` from `.env.default`.

Then:

```bash
cd my-storefront
pnpm install
pnpm dev          # http://localhost:5173
```

## First run

`.env.default` ships with a public demo backend so `cp .env.default .env && pnpm dev` boots. **Only `.env` is read**; `.env.default` is never loaded. Replace the three required values with your own before pointing at real data:

```bash
PUBLIC__app__commerce__api__clientId=...
PUBLIC__app__commerce__api__organizationId=...
PUBLIC__app__commerce__api__shortCode=...
```

Restart the dev server after editing `.env`. Dev fails fast if the short code is missing. Everything else has defaults in `config.server.ts`; see `storefront-next:sfnext-configuration`. If the project should target your own site, also set `PUBLIC__app__defaultSiteId` and `PUBLIC__app__commerce__sites` (JSON array) as described there.

Before shipping, run through the pre-launch gate in `storefront-next:sfnext-deployment` (demo analytics IDs, staging image host, demo credentials).

## Project layout (short form)

```
my-storefront/
├── AGENTS.md / CLAUDE.md        # Rules for coding agents -- read first
├── config.server.ts             # All app config defaults (metadata / runtime / app)
├── config-meta.json             # Values create-storefront prompts for
├── .env.default, .env           # Required credentials; only .env is loaded
├── package.json                 # Scripts + storefrontNext version stamp
├── react-router.config.ts, vite.config.ts, vite-plugins/
├── src/
│   ├── routes/                  # Flat file routes (_app.*, _checkout.*, _empty.*, action.*, resource.*)
│   ├── components/ (ui/ = primitives), hooks/, providers/, lib/, middlewares/
│   ├── extensions/              # Optional feature modules + config.json registry
│   ├── theme/                   # index.css entry, tokens/, overrides/
│   ├── locales/                 # <lang-REGION>/translations.json
│   ├── scapi/                   # Generated + custom SCAPI clients
│   ├── targets/                 # UI target (extension point) system
│   └── types/config.ts          # AppConfig type
├── cartridges/app_storefrontnext_base   # Page Designer metadata cartridge
├── docs/                        # README-*.md guides, COMPATIBILITY.md, migrations/
├── instructions/                # Extension install/uninstall guides (.mdc)
├── e2e/                         # Playwright suite (own package)
└── public/
```

See [PROJECT-STRUCTURE.md](references/PROJECT-STRUCTURE.md) for route families, key files, and where to go for each concern.

## Scripts and CLI

Run `pnpm <script>`. The most used: `dev`, `build`, `start` (preview the production build on :3000), `typecheck`, `lint`, `test`, `push`, `cartridge:generate|validate|deploy`, `config:inspect`, `config:push-env`, `bundlesize`, `storybook`. Full table in [SCRIPTS.md](references/SCRIPTS.md). The project's `package.json` `scripts` is the source of truth; grep it instead of guessing.

The `sfnext` binary (from `@salesforce/storefront-next-dev`, already a project dependency) is also reachable as `pnpm sfnext <cmd>` or `b2c sfnext <cmd>` (the b2c CLI prefers the project-local copy when run inside the project). Command reference: [SFNEXT-CLI.md](references/SFNEXT-CLI.md). The template also exposes `pnpm b2c` for the b2c CLI.

## Conventions worth knowing up front

- Application code is TypeScript/TSX only (`node scripts/check-typescript-only.js` flags stray `.js`). Linting is OxLint (`pnpm lint`, zero warnings), formatting is Biome (`pnpm format`).
- Imports use the `@/` alias to `src/`. Server-only modules are suffixed `.server.ts`.
- Use the site-aware `Link`/`NavLink` from `@/components/link` and `useNavigate` from `@/hooks/use-navigate`, not the React Router originals.
- Server `loader`/`action` only; no `clientLoader`/`clientAction`. Await only critical data; return non-critical data as promises (`storefront-next:sfnext-data-fetching`).
- Version compatibility between your project and the SDK: `package.json#storefrontNext` and `docs/COMPATIBILITY.md`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `pnpm install` fails or engine warning | Node < 24 or pnpm < 10.28; upgrade both |
| Dev server exits immediately about short code | `PUBLIC__app__commerce__api__shortCode` missing in `.env` (not `.env.default`) |
| SCAPI 401/403 | Client ID / organization ID / short code do not match the same org, or the SLAS client lacks scopes; run `sfnext setup-base-cartridge --slas-client-id <id>` only if the base cartridge scopes are the issue |
| `.env` change ignored | Restart `pnpm dev`; check with `pnpm config:inspect` |
| Unknown `sfnext` command via `b2c` | First use installs the plugin; run inside the project so the local copy is used |

## Finding more

- Project `AGENTS.md` doc index and `docs/README-*.md`
- `b2c docs search "<topic>" --category sfnext` (or MCP `docs_search`) for the published Storefront Next guides

## Related Skills

- `storefront-next:sfnext-overview` - Architecture and concept tour
- `storefront-next:sfnext-configuration` - config.server.ts, PUBLIC__ env vars, multi-site URLs
- `storefront-next:sfnext-deployment` - Build, push to MRT, cartridge deploy, pre-launch gate
- `storefront-next:sfnext-routing` - File routes and site-aware links
- `storefront-next:sfnext-extensions` - Install, remove, and create extensions
- `storefront-next:sfnext-theming` - Rebranding `src/theme/`
- `b2c-cli:b2c-mrt` - Generic MRT project/environment management
