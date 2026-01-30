# Component Patterns

## Use the `createPage` HOC

The `createPage` higher-order component standardizes page patterns with built-in Suspense and page key handling:

```typescript
import { use } from 'react';
import { createPage } from '@/components/create-page';

// Define your view component
function ProductView({
    product,
    category
}: {
    product: Promise<Product>;
    category?: Promise<Category>
}) {
    const productData = use(product);
    const categoryData = category ? use(category) : null;

    return (
        <div>
            <h1>{productData.name}</h1>
            {categoryData && <p>Category: {categoryData.name}</p>}
        </div>
    );
}

// Create page with fallback
const ProductPage = createPage({
    component: ProductView,
    fallback: <ProductSkeleton />
});

export default ProductPage;
```

**Benefits:**

- Eliminates repetitive Suspense/Await boilerplate
- Consistent loading states across pages
- Built-in page key management for navigation transitions
- Type-safe with full TypeScript support

## shadcn/ui Components

**RULES**:

- ✅ Add via: `npx shadcn@latest add <component-name>`
- ❌ DO NOT modify `src/components/ui/` directly
- ✅ Create custom components elsewhere

## Suspense Boundaries

Use granular Suspense boundaries for better UX:

```typescript
// ✅ RECOMMENDED - Multiple Suspense boundaries
export default function ProductPage({ loaderData: { product, reviews } }) {
    return (
        <div>
            <Suspense fallback={<ProductHeaderSkeleton />}>
                <Await resolve={product}>
                    {(data) => <ProductHeader product={data} />}
                </Await>
            </Suspense>

            <Suspense fallback={<ReviewsSkeleton />}>
                <Await resolve={reviews}>
                    {(data) => <ProductReviews reviews={data} />}
                </Await>
            </Suspense>
        </div>
    );
}

// ⚠️ OK - Single Suspense boundary (less granular)
export default createPage({
    component: ProductView,
    fallback: <ProductPageSkeleton />
});
```

## File Organization

```
src/components/product-tile/
├── index.tsx              # Component
├── index.test.tsx         # Tests
└── stories/
    ├── index.stories.tsx  # Storybook stories
    └── __snapshots__/     # Storybook snapshots (optional)
        └── product-tile-snapshot.tsx.snap

# Skeleton components are separate components
src/components/product-skeleton/
├── index.tsx
├── index.test.tsx
└── stories/
    └── index.stories.tsx
```

## Styling

**Tailwind CSS 4** is the only styling approach allowed. Use utility classes directly in components.

**Key rules:**

- ✅ Use Tailwind utility classes
- ✅ Use `cn()` utility for conditional classes
- ❌ NO inline styles, NO CSS modules, NO separate CSS files

**See `styling` section for:** Tailwind CSS 4, Shadcn/ui components, icons, responsive design, theme configuration, dark mode, best practices

## Best Practices

1. **Extract view components** - Separate data handling from presentation
2. **Type safety** - Define proper TypeScript interfaces
3. **Consistent fallbacks** - Reusable skeleton components
4. **Colocate tests** - Keep tests next to components
5. **Story coverage** - Create stories for all reusable components
6. **Tailwind utilities only** - Use Tailwind CSS classes, avoid inline styles or CSS modules
