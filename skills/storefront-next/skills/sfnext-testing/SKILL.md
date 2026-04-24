---
name: sfnext-testing
description: Write tests for Storefront Next using Vitest unit tests, Storybook stories, interaction tests, snapshot tests, and accessibility tests. Use when writing component tests, creating Storybook stories, running test coverage, or setting up test utilities. Covers testing-library patterns, play functions, and coverage thresholds.
---

# Testing Skill

This skill covers testing patterns in Storefront Next — Vitest for unit tests and Storybook for component stories, interaction tests, and accessibility validation.

## Unit Tests (Vitest)

Test files live alongside source files with `.test.ts` or `.test.tsx` extension:

```typescript
// src/components/product-card/product-card.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './product-card';
import { mockProduct } from '@/test-utils/mocks';

describe('ProductCard', () => {
    it('renders product name', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText(mockProduct.productName)).toBeInTheDocument();
    });
});
```

### Test Utilities

Shared utilities in `src/test-utils/`:

- `config.ts` — Mock configuration objects and ConfigProvider wrappers
- `context-provider-utils.ts` — Context provider helpers for testing
- `context-provider.tsx` — Test context providers

### Running Tests

```bash
pnpm test                # Run all tests with coverage
pnpm test:ui             # Open interactive Vitest UI
pnpm test:watch          # Watch mode (re-run on changes)
```

### Coverage Requirements

Thresholds enforced in `vitest.thresholds.ts`:

| Metric | Minimum |
|--------|---------|
| Lines | 73% |
| Statements | 73% |
| Functions | 72% |
| Branches | 67% |

### Testing Libraries

- `@testing-library/react` — Component rendering and queries
- `@testing-library/jest-dom` — Custom DOM matchers (`toBeInTheDocument`, etc.)
- `@testing-library/user-event` — User interaction simulation
- `@vitest/coverage-v8` — Code coverage
- `@vitest/ui` — Interactive test UI

## Storybook

Every reusable component should have a `.stories.tsx` file.

### Story Structure

```typescript
// src/components/product-card/product-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { ProductCard } from './product-card';
import { ConfigProvider } from '@/config/context';
import { mockConfig } from '@/test-utils/config';
import { mockProduct } from '@/test-utils/mocks';

const meta: Meta<typeof ProductCard> = {
    title: 'Components/ProductCard',
    component: ProductCard,
    tags: ['autodocs', 'interaction'],
    decorators: [
        (Story) => (
            <ConfigProvider config={mockConfig}>
                <Story />
            </ConfigProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
    args: {
        product: mockProduct,
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByText(mockProduct.productName)).toBeInTheDocument();
    },
};
```

See [Storybook Patterns Reference](references/STORYBOOK-PATTERNS.md) for advanced patterns.

### Storybook Commands

```bash
pnpm storybook                              # Dev server (port 6006)
pnpm build-storybook                        # Build static Storybook
pnpm test-storybook:snapshot                # Snapshot tests
pnpm test-storybook:snapshot:update         # Update snapshots
pnpm test-storybook:interaction             # Interaction tests
pnpm test-storybook:a11y                    # Accessibility tests
pnpm generate:story-tests:coverage          # Story coverage report
```

### Story Tags

| Tag | Purpose |
|-----|---------|
| `autodocs` | Enable automatic documentation |
| `interaction` | Include in interaction test runs |
| `skip-a11y` | Exclude from a11y tests (use sparingly) |

## Route Testing

Mock loaders, actions, and React Router context:

```typescript
// src/routes/_app.product.$productId.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/components/product-view', () => ({
    default: ({ product }: any) => (
        <div data-testid="product-view">
            <div data-testid="product-name">{product?.name}</div>
        </div>
    ),
}));
```

## Test Organization

```
src/
├── components/
│   ├── product-card/
│   │   ├── index.tsx              # Component
│   │   ├── index.test.tsx         # Unit tests
│   │   └── stories/
│   │       └── index.stories.tsx  # Stories
├── routes/
│   ├── _app.product.$productId.tsx
│   └── _app.product.$productId.test.tsx
└── test-utils/                    # Shared utilities
    ├── config.ts
    └── context-provider-utils.ts
```

## Best Practices

1. **Colocate tests** — Keep test files next to source files
2. **Use test utilities** — Leverage `@/test-utils` for mocks and providers
3. **Mock external dependencies** — Use `vi.mock()` for API clients and context
4. **Test interactions** — Use `@testing-library/user-event` and Storybook play functions
5. **Test accessibility** — Use Storybook a11y addon
6. **Multiple story variants** — Create stories for Default, Loading, Error states
7. **Use viewport toolbar** — Test responsive layouts via Storybook's built-in viewport toolbar

## Related Skills

- `storefront-next:sfnext-components` - Component patterns that need testing
- `storefront-next:sfnext-data-fetching` - Mocking loaders and actions in tests
- `storefront-next:sfnext-page-designer` - Testing Page Designer components

## Reference Documentation

- [Storybook Patterns Reference](references/STORYBOOK-PATTERNS.md) - Advanced story patterns and testing
