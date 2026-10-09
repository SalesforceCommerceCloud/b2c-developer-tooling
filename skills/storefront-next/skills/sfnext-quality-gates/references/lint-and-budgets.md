# Lint configuration and performance budgets

## Configuration files in your project

| File | Role |
|------|------|
| `.oxlintrc.json` | All lint rules, custom JS-plugin rules (`custom/*`), overrides for tests/stories, `ignorePatterns` |
| `biome.json` | Formatter only (linter and assists disabled) |
| `lint-plugins/` | Source of the `custom/color-linter` and `custom/header-format` rules |
| `e2e/biome.json` and e2e scripts | The e2e package lints and formats itself; it is not type-aware linted |

OxLint's JS-plugin loader needs Node >= 22.6; the project requires Node 24.

Test files relax some rules (fixtures use ad-hoc roles and handlers); story and test overrides are in `.oxlintrc.json`.

## Editor integration

Install the Oxc VS Code extension for inline diagnostics and the Biome extension (set as default formatter) for format on save.

## Bundle size

- Limits: `package.json#bundlesize` with `client` and `server` arrays of `{ name: <glob>, limit: '<size>' }`. Defaults are generous if absent.
- `pnpm bundlesize` writes `build/<env>-bundlemeta.json` per environment.
- Visualize: `cross-env BUNDLES_SIZE_ANALYZE=true pnpm build` opens `build/client-bundle-size.html` and `build/ssr-bundle-size.html` (`docs/README-PERFORMANCE.md`).
- Before adding a large dependency, check its impact with the visualizer, lazy-load it (`React.lazy` or dynamic `import()`), and prefer server-only code for heavy logic.

## Lighthouse CI

- `lighthouserc.cjs` defines the URLs (home, a PDP, cart), number of runs, category score minimums (performance, accessibility, SEO, best-practices) and ceilings for `resource-summary:script:size` and `resource-summary:document:size` per route.
- The shipped numbers are tuned to the starter theme. Your customizations (new scripts, bigger documents, different sites or product ids in the URL list) will move them. Update URLs to pages that exist in your catalog, then measure and set ceilings deliberately, with headroom, rather than deleting assertions.
- Run `pnpm build` first; the config starts the preview server on port 3001 itself.
- Also run `pnpm bundlesize` in CI or locally so regressions show up per chunk, not just in page totals.

## When a budget fails

1. Identify what grew: compare bundle metadata (`pnpm bundlesize:compare`) or the visualizer.
2. Look for eager imports of heavy modules in root, layouts or shared components; convert to lazy loads.
3. Check that new third-party scripts are deferred (see `storefront-next:sfnext-performance`).
4. Only then raise a limit, in the smallest increment, and note why in the commit message.
