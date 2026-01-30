# Testing Strategy

## Unit Tests (Vitest)

This project uses **Vitest** for unit tests, running under Vite with jsdom as the default test environment.

### Test File Organization

Tests live alongside source files with `.test.ts` or `.test.tsx` extension:

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

Test utilities are available in `src/test-utils/`:
- `config.ts` - Mock configuration objects and ConfigProvider wrappers
- `context-provider-utils.ts` - Context provider helpers for testing
- `context-provider.tsx` - Test context providers

### Running Tests

```bash
# Run all tests with coverage
pnpm test

# Open Vitest UI (interactive test runner)
pnpm test:ui

# Watch mode (re-run on file changes)
pnpm test:watch

# Generate coverage report
pnpm test
# Coverage report outputs to console and coverage/ directory
```

### Coverage Requirements

Coverage thresholds are enforced in `vitest.thresholds.ts`:
- Lines: 73%
- Statements: 73%
- Functions: 86%
- Branches: 87%

These thresholds represent minimum values that must not be undershot. They should be raised regularly to reflect current status.

### Testing Libraries

- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom Jest DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **@vitest/coverage-v8** - Code coverage
- **@vitest/ui** - Interactive test UI

## Storybook Testing

Every reusable component should have a Storybook story file (`.stories.tsx`).

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

### Storybook Commands

```bash
# Development server (port 6006)
pnpm storybook

# Build static Storybook
pnpm build-storybook

# Snapshot tests (visual regression)
pnpm test-storybook:snapshot
pnpm test-storybook:snapshot:update  # Update snapshots

# Interaction tests (play functions)
pnpm test-storybook:interaction
pnpm test-storybook:static:interaction  # Against static build

# Accessibility tests
pnpm test-storybook:a11y
pnpm test-storybook:static:a11y  # Against static build

# Generate story tests with coverage
pnpm generate:story-tests:coverage
```

### Storybook Features

- **@storybook/addon-docs** - Automatic documentation generation
- **@storybook/addon-a11y** - Accessibility testing and validation
- **@storybook/addon-vitest** - Integration with Vitest
- **@storybook/test-runner** - Automated testing (interaction, a11y)
- **Viewport Toolbar** - Built-in toolbar for testing different screen sizes

> **Important**: Use Storybook's built-in viewport toolbar instead of creating separate Mobile/Tablet/Desktop stories. Use the viewport selector in the Storybook toolbar to test components at different screen sizes.

### Story Tags

- `autodocs` - Enable automatic documentation
- `interaction` - Include in interaction test runs
- `skip-a11y` - Exclude from a11y tests (use sparingly)

## Testing Best Practices

### Component Testing

1. **Colocate tests** - Keep test files next to source files
2. **Use test utilities** - Leverage `@/test-utils` for mocks and providers
3. **Mock external dependencies** - Use `vi.mock()` for API clients, context providers, etc.
4. **Test user interactions** - Use `@testing-library/user-event` for realistic interactions
5. **Test accessibility** - Use Storybook a11y addon and test-runner

### Storybook Stories

1. **Multiple variants** - Create stories for different states (Default, Loading, Error, etc.)
2. **Play functions** - Use `play` functions for interaction testing
3. **Decorators** - Wrap stories with necessary providers (ConfigProvider, etc.)
4. **Documentation** - Include component descriptions and prop documentation
5. **Viewport testing** - Use built-in viewport toolbar, not separate stories

### Route Testing

Route tests should mock:
- Loader functions and their return values
- Action functions
- React Router context
- API clients

Example:

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

// Test route component...
```

## Testing Recommendations

### SEO Crawler Emulation

- Use **Googlebot user agent** in network conditions to emulate SEO crawler behavior
- This changes React Router's streaming strategy and shows what crawlers see for SSR
- Helps verify server-side rendering works correctly for search engines

### Coverage Goals

- Maintain coverage above thresholds defined in `vitest.thresholds.ts`
- Raise thresholds regularly as coverage improves
- Focus on testing critical paths and user-facing functionality

### Test Organization

```
src/
├── components/
│   ├── product-card/
│   │   ├── index.tsx              # Component
│   │   ├── index.test.tsx          # Unit tests
│   │   └── index.stories.tsx       # Storybook stories
├── routes/
│   ├── _app.product.$productId.tsx
│   └── _app.product.$productId.test.tsx
└── test-utils/                     # Shared test utilities
    ├── config.ts
    └── context-provider-utils.ts
```

## References

- **README-TESTS.md** - Complete testing documentation
- **.storybook/README-STORYBOOK.md** - Storybook setup and usage guide
- **vitest.thresholds.ts** - Coverage threshold definitions
