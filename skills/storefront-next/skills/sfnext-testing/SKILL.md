---
name: sfnext-testing
description: >-
  Write and run tests for a Storefront Next project: Vitest + React Testing Library unit tests, route loader/action tests (createLoaderArgs, createTestContext), Storybook stories with snapshot, interaction (play) and a11y runs, and a pointer to the CodeceptJS/Playwright e2e suite. Use for "write a test for this component/loader", "add a story", pnpm test, pnpm storybook:test --type=snapshot|interaction|a11y, coverage thresholds, routeLoaderData / scapiMock / mockRoutes story parameters, MSW mocking, fixtures in @/components/__mocks__, failing snapshot updates, or pnpm e2e. Do not use for lint, typecheck, format, bundle-size or Lighthouse gates (use `storefront-next:sfnext-quality-gates`), accessibility rules and fixes (use `storefront-next:sfnext-accessibility`), or translations (use `storefront-next:sfnext-i18n`).
---

# Testing Storefront Next

Three layers, all shipped in your project (see `docs/README-TESTS.md`, `docs/README-STORYBOOK.md`, `AGENTS.md`):

| Layer | Tool | Files | Command |
|-------|------|-------|---------|
| Unit and route tests | Vitest, jsdom, Testing Library, MSW | `*.test.ts(x)` next to source | `pnpm test` |
| Component stories | Storybook: snapshot (Vitest), interaction and a11y (Playwright/Chromium) | `<component>/stories/*.stories.tsx` | `pnpm storybook:test --type=...` |
| End to end | CodeceptJS + Playwright | `e2e/` | `pnpm e2e` |

Prefer the cheapest layer that proves the behavior: pure logic and loaders in Vitest, rendered states and interactions in stories, cross-page shopper flows in e2e.

## Commands

```bash
pnpm test                         # all unit tests (vitest run); does NOT collect coverage
pnpm test src/components/footer   # one file or directory
pnpm test:watch                   # watch mode
pnpm test --coverage              # coverage report (thresholds enforced)
pnpm test --ui                    # Vitest UI

pnpm storybook                                        # dev server on :6006
pnpm exec playwright install chromium                 # once, for interaction/a11y runs
pnpm storybook:test --type=snapshot                   # add --update to rewrite snapshots
pnpm storybook:test --type=interaction                # play() functions in real Chromium
pnpm storybook:test --type=a11y                       # axe checks
pnpm storybook:test --type=snapshot --stories=footer  # narrow to matching story paths
```

Add `--static` (optionally `--reuse-build` after `pnpm storybook:build`) to run interaction or a11y against a static build. `--coverage` with snapshot generates story tests and reports story coverage.

Coverage thresholds live inline in `vitest.config.ts` (`thresholds`), and `src/components/ui/**`, stories, snapshot fixtures and `__mocks__` are excluded from coverage. Do not chase 100%.

## Unit test

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AllProvidersWrapper } from '@/test-utils/context-provider';
import MyThing from './index';

describe('MyThing', () => {
    it('renders the label', () => {
        render(<MyThing label="Hello" />, { wrapper: AllProvidersWrapper });
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
});
```

`vitest.setup.ts` already provides jest-dom matchers, i18next (`en-GB`), `window.__APP_CONFIG__`, a global mock of `@/hooks/use-analytics`, and a 10s async-util timeout; do not re-add them. Helpers, wrappers and the analytics caveat: [references/UNIT-AND-ROUTE-TESTS.md](references/UNIT-AND-ROUTE-TESTS.md).

## Route loader / action test

```ts
import { describe, expect, it, vi } from 'vitest';
import { createLoaderArgs, createTestContext } from '@/lib/test-utils';
import { loader } from './resource.basket-products';

vi.mock('@/lib/api-clients.server', () => ({ createApiClients: vi.fn() }));

it('returns data', async () => {
    const context = createTestContext({ authSession: { userType: 'guest' } });
    const args = createLoaderArgs(new Request('http://localhost/x'), context, {
        params: {},
        pattern: '/' as never,
    });
    const result = await loader(args);
    expect(result).toBeDefined();
});
```

`createActionArgs` is the action twin and `expectStatus(result, 400)` asserts `data()` statuses. Mock `@/lib/api-clients.server` (SCAPI) at the module boundary, or use MSW for HTTP-level tests. See `storefront-next:sfnext-data-fetching` for the loader patterns under test.

## Stories

Stories live in a `stories/` subfolder next to the component (required; coverage tooling only matches there):

```
src/components/footer/
├── index.tsx
├── index.test.tsx
└── stories/
    ├── index.stories.tsx
    ├── footer-snapshot.tsx      # snapshot fixture, only where a snapshot test exists
    └── __snapshots__/
```

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { mockProductSearchItem } from '@/components/__mocks__/product-search-hit-data';
import ProductTile from '../index';

const meta: Meta<typeof ProductTile> = {
    title: 'Products/Product Tile', // Domain/Component from the fixed sidebar groups
    component: ProductTile,
    tags: ['autodocs', 'interaction'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { product: mockProductSearchItem },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        await expect(within(canvasElement).getAllByRole('link')[0]).toBeInTheDocument();
    },
};
```

Rules of thumb:

- Every story is already wrapped by a global decorator (memory router + config, site, i18n, auth, basket providers). Do not add your own `ConfigProvider`. If you truly need one, import it from `@salesforce/storefront-next-runtime/config`.
- Import test helpers from `storybook/test` (not `@storybook/test`).
- Props first; mock at the route boundary with `parameters` (`routeLoaderData`, `scapiMock`, `miniCartData`, `mockRoutes`), never `vi.mock` of hooks inside a story. Args must be JSON-serializable.
- Tags: `autodocs` (docs page), `interaction` (included in interaction runs), `skip-a11y` (excluded from a11y runs; use sparingly and comment why).
- Use Storybook's viewport toolbar instead of separate mobile/desktop stories.
- Fixtures: `@/components/__mocks__` (barrel of curated fixtures) or `@/components/__mocks__/<file>` for ones not re-exported; shared with unit tests.

Full reference, including parameters, mock routes, taxonomy and argTypes: [references/STORYBOOK-PATTERNS.md](references/STORYBOOK-PATTERNS.md).

## End to end

`e2e/` is a separate CodeceptJS + Playwright project with its own `AGENTS.md`. Run `pnpm e2e` (add `--mode=local` to start the dev server, `--grep "@checkout"`, `--headed`). To author tests, use the skills shipped in your project at `e2e/.claude/skills/generate-storefront-e2e-test` and `e2e/.claude/skills/checkout-test-development`. Setup, env vars and the `pnpm a11y` scan: [references/E2E.md](references/E2E.md).

## Pitfalls

| Pitfall | Fix |
|---------|-----|
| Story outside `stories/` | Move it; coverage and generated snapshot tests only find `stories/*.stories.tsx`. |
| Interaction/a11y run fails to launch a browser | `pnpm exec playwright install chromium`. |
| Snapshot diff after an intentional DOM change | Review it, then `pnpm storybook:test --type=snapshot --update`. |
| Test passes but analytics never fires | `@/hooks/use-analytics` is mocked globally; `vi.unmock` it in the test to assert on track calls. |
| Portalled dialog/toast not found in a play function | Query `within(canvasElement.ownerDocument.body)`. |
| Mocking too deep | If an internal refactor forces story edits, push the mock to the route/fixture layer. |

## Related Skills

- `storefront-next:sfnext-quality-gates` - lint, typecheck, format and the pre-PR checklist
- `storefront-next:sfnext-accessibility` - a11y assertions in stories and the e2e axe scan
- `storefront-next:sfnext-components` - component conventions under test
- `storefront-next:sfnext-data-fetching` - loaders and actions
- `storefront-next:sfnext-page-designer` - testing Page Designer components
- `storefront-next:sfnext-i18n` - translations in tests
