# End-to-end tests

`e2e/` is a standalone CodeceptJS + Playwright project shipped with your storefront, with its own `e2e/AGENTS.md`, `e2e/README.md`, `e2e/docs/`, and in-project skills:

- `e2e/.claude/skills/generate-storefront-e2e-test/SKILL.md`: structured workflow for new specs, page objects, flows and self-healing recipes.
- `e2e/.claude/skills/checkout-test-development/`: checkout-specific E2E, debugging and performance guidance.

Use those skills when authoring or debugging e2e tests; this page only orients you.

## Setup

```bash
cp e2e/.env.sample e2e/.env     # BASE_URL, SITE_ID, SITE_ALIAS, LOCALE, HEADLESS, ...
pnpm install                    # per e2e/README.md this also installs Playwright browsers; if not, pnpm exec playwright install chromium
```

The storefront itself needs its own `.env` (see `storefront-next:sfnext-configuration`).

## Run

```bash
pnpm e2e                        # against a running storefront (BASE_URL, default http://localhost:5173)
pnpm e2e --mode=local           # start the dev server automatically
pnpm e2e --mode=remote          # BASE_URL must point at the deployed storefront
pnpm e2e --grep "@checkout"     # filter by tag or name
pnpm e2e --headed               # show the browser
pnpm e2e --debug                # Playwright Inspector
pnpm e2e:turnstile              # Turnstile-specific suite
pnpm a11y                       # axe scans of key pages, desktop + mobile (see sfnext-accessibility)
```

The root scripts above delegate to `e2e/`; you do not need to run them from inside it.

## Keep in mind

- E2E runs against real backend data; prefer unit tests and stories for logic and visual states, and keep e2e for shopper journeys (search, PDP to cart, checkout, login).
- Optional AI healing is off unless you pass `--ai` and set `ANTHROPIC_API_KEY` in `e2e/.env`.
- `e2e/` is excluded from the root OxLint/Vitest runs and has its own `lint`, `format:check`, `typecheck` and `test` scripts (run from `e2e/`).
