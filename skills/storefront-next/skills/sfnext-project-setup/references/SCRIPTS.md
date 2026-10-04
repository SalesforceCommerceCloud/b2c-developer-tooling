# Project Scripts

Scripts in a Storefront Next project's `package.json`. Run with `pnpm <name>`; extra flags after the name are forwarded (`pnpm test --coverage`). If a script here is missing in your project, `grep -A60 '"scripts"' package.json` -- your project is the source of truth.

## Develop and run

| Script | Does |
| --- | --- |
| `dev` | Aggregates extension locales and config, then starts `sfnext dev` (Vite SSR, HMR) on http://localhost:5173. Runs with the `dev-data-store` Node condition |
| `dev:debug` | Same with `--inspect` for a Node debugger |
| `dev:log` | Dev with `SFCC_LOG_LEVEL=debug` |
| `build` | `locales:aggregate-extensions`, `config:aggregate-extensions`, `cartridge:generate`, then `react-router build` -> `build/` |
| `start` / `preview` | `sfnext preview`: serves the production build on http://localhost:3000 (builds if needed; `SFNEXT_DATA_STORE_UNAVAILABLE_MODE=fallback`) |

## Deploy and operate

| Script | Does |
| --- | --- |
| `push` | `sfnext push --project-directory .` -- uploads `build/` to Managed Runtime. Build first. Pass flags after it: `pnpm push -- --wait -e staging` |
| `cartridge:generate` | `sfnext generate-cartridge` -- Page Designer metadata from decorators |
| `cartridge:validate` | `sfnext validate-cartridge` -- validate metadata JSON against schemas |
| `cartridge:deploy` | `sfnext deploy-cartridge` -- upload cartridges to the B2C instance (`-- --delete` wipes old files first) |
| `config:inspect` | `sfnext config inspect` -- show which `config.server.ts` values are overridden by `.env` or MRT |
| `config:push-env` | `b2c mrt env var push` -- sync `.env` variables to an MRT environment |
| `config:aggregate-extensions`, `locales:aggregate-extensions` | Merge per-extension config / translations; run automatically by `dev`, `build`, `typecheck` |
| `b2c` | Run the b2c CLI from the project (`pnpm b2c --help`) |

## Quality

| Script | Does |
| --- | --- |
| `typecheck` | Aggregate extension config, `react-router typegen`, then `tsc --noEmit` |
| `lint` / `lint:fix` | OxLint (type-aware, zero warnings) plus Biome format check / fix |
| `format` / `format:check` | Biome |
| `lint:a11y`, `lint:css`, `a11y:scan-coverage` | Static accessibility lint, CSS/token lint, a11y scan coverage report |
| `test` / `test:watch` | Vitest (`pnpm test src/components/foo` for one path) |
| `storybook` | Storybook on http://localhost:6006 |
| `storybook:build` | Static Storybook build |
| `storybook:test` | Story tests: `--type=snapshot \| interaction \| a11y`, `--static`, `--update` |
| `bundlesize` | Build with `BUNDLES_SIZE_CHECK=true` to enforce bundle limits |
| `bundlesize:compare` | Compare bundle sizes between builds |
| `lighthouse:ci` | Lighthouse CI run |
| `extensions:list` | List extension points |
| `e2e`, `e2e:turnstile`, `a11y` | Playwright suites in `e2e/` |
| `chromatic:core` | Chromatic visual-test helper |

Bundle treemap: `cross-env BUNDLES_SIZE_ANALYZE=true pnpm build` (writes `build/client-bundle-size.html`).
