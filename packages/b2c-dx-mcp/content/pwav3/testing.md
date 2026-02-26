# Testing

## Overview

PWA Kit applications use Jest and React Testing Library for testing. Tests are co-located with source files using the `.test.js` or `.test.jsx` suffix.

## Testing Stack

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking at network layer
- **jest-fetch-mock** - Fetch API mocking

## Test File Organization

Co-locate test files with source code:

```
app/components/product-tile/
├── index.jsx
└── product-tile.test.jsx

app/hooks/
├── use-current-basket.js
└── use-current-basket.test.js
```

## Jest Configuration

**Reference:** The template uses `@salesforce/pwa-kit-dev/configs/jest`. Extend it and set `moduleNameMapper` for `@salesforce/retail-react-app` if needed.

## Component Testing

Use `render`/`screen` from React Testing Library, `userEvent` for interactions. See `app/components/product-tile/index.test.jsx` and other `*.test.js` files in the template for patterns.

### Test Utilities

Use `renderWithProviders` from `app/utils/test-utils` for components that need Commerce API, routing, Chakra UI, and React Query. See template tests (e.g. `app/pages/product-detail/index.test.js`) for examples.

## Mocking Commerce SDK Hooks

```jsx
import {useProduct} from '@salesforce/commerce-sdk-react';

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useProduct: jest.fn()
}));

test('displays product when loaded', () => {
    useProduct.mockReturnValue({
        data: {id: 'test-123', name: 'Test Product'},
        isLoading: false,
        error: null
    });

    render(<ProductDetail productId="test-123" />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
});
```

## MSW for API Mocking

```javascript
// mocks/handlers.js
import {rest} from 'msw';

export const handlers = [
    rest.get('*/products/:productId', (req, res, ctx) => {
        return res(ctx.json({
            id: req.params.productId,
            name: 'Mock Product',
            price: 29.99
        }));
    })
];
```

## Testing User Interactions

```jsx
import userEvent from '@testing-library/user-event';

test('adds item to cart when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductDetail productId="test-123" />);

    const addButton = screen.getByRole('button', {name: /add to cart/i});
    await user.click(addButton);

    await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
    });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- product-tile.test.jsx
```

## Best Practices

1. Test user behavior, not implementation
2. Use semantic queries (getByRole, getByLabelText)
3. Co-locate tests with source
4. Mock external dependencies
5. Write descriptive test names
6. Avoid testing library internals
7. Use MSW for API mocking
8. Keep tests simple and focused
9. Maintain high coverage (70%+)
