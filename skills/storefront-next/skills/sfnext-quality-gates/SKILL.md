---
name: sfnext-quality-gates
description: >-
  Run and fix the Storefront Next quality gates before a PR or deploy: OxLint (type-aware, --max-warnings 0) plus Biome formatting, lint:a11y, lint:css, typecheck, the TypeScript-only check, bundle-size budgets, Lighthouse CI, and the pre-PR checklist. Use when pnpm lint, pnpm format:check, pnpm typecheck, pnpm bundlesize or pnpm lighthouse:ci fails, for custom/color-linter or custom/header-format errors, "unused Tailwind class" findings, oxlint-disable comments, "what should I run before opening a PR", or CI red on lint. Do not use for writing tests (use `storefront-next:sfnext-testing`), accessibility fixes themselves (use `storefront-next:sfnext-accessibility`), or runtime performance tuning (use `storefront-next:sfnext-performance`).
---

# Storefront Next Quality Gates

Your project enforces style, types, size and accessibility with a few commands. CI runs the same ones, and lint is strict: any warning fails.

## Pre-PR checklist

```bash
pnpm lint            # OxLint (type-aware, --max-warnings 0) then Biome format check
pnpm typecheck       # route typegen + tsc --noEmit
pnpm test            # unit tests
pnpm storybook:test --type=snapshot   # if you touched components or stories
pnpm bundlesize      # if you added dependencies or large components
```

If you changed UI, also run `pnpm storybook:test --type=interaction` and `--type=a11y` (needs `pnpm exec playwright install chromium`). Fix formatting and auto-fixable lint in one go with `pnpm lint:fix`.

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm lint` | `oxlint --type-aware --report-unused-disable-directives --max-warnings 0` (e2e excluded) then `biome format` check, then the e2e package's own lint |
| `pnpm lint:fix` | `oxlint --fix` then `biome format --write` |
| `pnpm format` / `pnpm format:check` | Biome formatting only (4-space indent, 120 columns, single quotes in JS, double in JSX) |
| `pnpm lint:a11y` | Reports only `jsx-a11y/*` findings; exit 1 if any (see `storefront-next:sfnext-accessibility`) |
| `pnpm lint:css` | After a build, checks the built app stylesheet for Tailwind candidates that only come from stories, tests or docs (dead or story-only classes). Run `pnpm build` first |
| `pnpm typecheck` | `react-router typegen` then `tsc --noEmit` (uses extra heap) |
| `node scripts/check-typescript-only.js` | Fails if `.js/.jsx/.mjs/.cjs` exist under `src/` |
| `pnpm bundlesize` | Builds with `BUNDLES_SIZE_CHECK=true`; fails if chunks exceed limits in `package.json#bundlesize` (`client` and `server` lists) |
| `pnpm bundlesize:compare` | Compares two bundle metadata files: `node scripts/compare-bundlesize.mjs --baseline <path> --candidate <path> [--tolerance <pct>]` |
| `pnpm lighthouse:ci` | `lhci autorun` using `lighthouserc.cjs` (build first; it starts the preview server itself) |
| `pnpm config:inspect` | Prints the resolved config to debug env overrides |

ESLint and Prettier are not used. OxLint owns all linting (including type-aware rules and custom plugin rules); Biome owns only formatting.

## Custom rules you will hit

- `custom/color-linter`: use design tokens (`bg-primary`, `text-muted-foreground`), not hard-coded colors. See `storefront-next:sfnext-theming`.
- `custom/header-format`: every TS/JS file needs the Apache 2.0 license header. Copy it from any existing source file.
- `jsx-a11y/*` recommended set at error, plus `no-aria-hidden-on-focusable`, `anchor-ambiguous-text`, `no-redundant-roles` (allows `role="list"` on `ul`) and `alt-text` extended to `DynamicImage` and `ProductImage`.
- `no-restricted-imports`: browser-only `@salesforce/storefront-next-runtime/i18n/client` is blocked from server modules.
- TypeScript only in `src/`.

Fix the code rather than disabling. If a suppression is truly needed, use a scoped `// oxlint-disable-next-line <rule> -- reason`. `--report-unused-disable-directives` fails stale ones. Generated and vendored trees (SCAPI generated clients, `src/components/ui/**`, build output) are skipped by lint and format.

More: [references/lint-and-budgets.md](references/lint-and-budgets.md) and `docs/README-LINTING.md` (skip the sections about repository internals that do not apply to your project).

## Typical failures

| Symptom | Fix |
|---------|-----|
| `pnpm lint` fails only at the end on formatting | `pnpm format` |
| Warning count > 0 | Warnings are errors here; fix or justify with a scoped disable |
| `jsx-a11y/...` error | Fix markup; run `pnpm lint:a11y` while iterating |
| Type errors about `+types/...` routes | Run `pnpm typecheck` (it regenerates route types) |
| `pnpm lint:css` cannot find stylesheet | Run `pnpm build` first |
| Lighthouse/bundle budget exceeded after adding a feature | See the budget notes in the reference; look for eager imports before raising a limit |

## Related Skills

- `storefront-next:sfnext-testing` - unit, story and e2e tests (the test half of the checklist)
- `storefront-next:sfnext-accessibility` - fixing a11y lint and scan findings
- `storefront-next:sfnext-performance` - reducing bundle and page weight
- `storefront-next:sfnext-theming` - design tokens behind `color-linter`
- `storefront-next:sfnext-deployment` - build and push after the gates pass
