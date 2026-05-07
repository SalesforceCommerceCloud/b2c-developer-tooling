---
name: sfnext-components
description: Build UI components in Storefront Next using createPage HOC, Suspense/Await patterns, shadcn/ui, and Tailwind CSS v4. Use when creating page components, adding Suspense boundaries, integrating shadcn/ui, styling with Tailwind, or organizing component files. Covers server vs client rendering patterns and the cn() utility.
---

# Components Skill

This skill covers component development patterns in Storefront Next — createPage HOC, Suspense boundaries, shadcn/ui integration, and Tailwind CSS styling.

## Page Component Pattern

Most routes export a default function component that receives `loaderData` as props:

```typescript
import { Suspense } from 'react';
import { Await } from 'react-router';
import { SeoMeta } from '@/components/seo-meta';

type ProductPageData = {
    product: Promise<Product>;
    reviews: Promise<Reviews>;
};

export default function ProductPage({ loaderData }: { loaderData: ProductPageData }) {
    return (
        <>
            <SeoMeta title="Product" />
            <Suspense fallback={<ProductHeaderSkeleton />}>
                <Await resolve={loaderData.product}>
                    {(product) => <ProductHeader product={product} />}
                </Await>
            </Suspense>
            <Suspense fallback={<ReviewsSkeleton />}>
                <Await resolve={loaderData.reviews}>
                    {(reviews) => <ProductReviews reviews={reviews} />}
                </Await>
            </Suspense>
        </>
    );
}
```

### createPage HOC (Optional)

For pages needing standardized Suspense wrappers and page key management:

```typescript
import { createPage } from '@/components/create-page';

export default createPage({
    component: ProductView,
    fallback: <ProductSkeleton />,
});
```

## Suspense Boundaries and Code Splitting

Use `<Suspense>` + `<Await>` for streaming loader data, and `lazy()` for code-splitting heavy components:

```typescript
import { lazy, Suspense } from 'react';

// Code-split a heavy component
const CustomerReviewsSection = lazy(() =>
    import('@/components/customer-reviews-section/customer-reviews-section')
);

export default function ProductPage({ loaderData }: { loaderData: ProductPageData }) {
    return (
        <>
            {/* Stream loader data */}
            <Suspense fallback={<ProductHeaderSkeleton />}>
                <Await resolve={loaderData.product}>
                    {(product) => <ProductHeader product={product} />}
                </Await>
            </Suspense>

            {/* Code-split component */}
            <Suspense fallback={<ReviewsSkeleton />}>
                <CustomerReviewsSection productId={loaderData.productId} />
            </Suspense>
        </>
    );
}
```

## shadcn/ui Components

shadcn/ui provides pre-built accessible components. Add them via CLI:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

**Rules:**

- Add components via CLI only (do not manually create files in `src/components/ui/`)
- `src/components/ui/` components are copied into your project and can be customized directly
- Keep app/domain components outside `src/components/ui/`:

```typescript
// Optional wrapper for app-specific styling
import { Button } from '@/components/ui/button';

export function PrimaryButton(props: React.ComponentProps<typeof Button>) {
    return <Button {...props} className={cn('rounded-full', props.className)} />;
}
```

## Tailwind CSS Styling

Tailwind CSS v4 is the only permitted styling approach:

```typescript
import { cn } from '@/lib/utils';

export function ProductCard({ featured }: { featured?: boolean }) {
    return (
        <div className={cn(
            'rounded-lg border border-border bg-card p-4',
            featured && 'ring-2 ring-primary'
        )}>
            <h2 className="text-lg font-semibold text-card-foreground">
                Product Name
            </h2>
        </div>
    );
}
```

**Rules:**

- Use Tailwind utility classes as the primary styling approach
- Use `cn()` for conditional class merging
- Follow mobile-first responsive design (`md:`, `lg:` breakpoints)
- Prefer Tailwind over inline styles; inline styles are acceptable for truly dynamic values (e.g., `backgroundColor` from API data)
- No CSS modules or separate CSS files
- Custom global CSS only in `src/app.css`

### Dark Mode

Theme variables automatically adapt via CSS variables:

```typescript
<div className="bg-background text-foreground border-border">
    <button className="bg-primary text-primary-foreground">Click me</button>
</div>
```

### Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

## File Organization

```
src/components/product-tile/
├── index.tsx              # Component implementation
├── index.test.tsx         # Vitest unit tests
└── stories/
    ├── index.stories.tsx  # Storybook stories
    └── __snapshots__/     # Storybook snapshots (optional)

src/components/product-skeleton/
├── index.tsx              # Skeleton component (separate from main)
├── index.test.tsx
└── stories/
    └── index.stories.tsx
```

## Best Practices

1. **Export default function components** — Receive `loaderData` as props
2. **Granular Suspense boundaries** — Show content progressively as data resolves
3. **Use `lazy()` for heavy components** — Code-split below-the-fold or conditional UI
4. **Reusable skeleton components** — Consistent loading states
5. **Colocate tests and stories** — Keep test files next to source files
6. **TypeScript interfaces** — Define proper types for all props

## Related Skills

- `storefront-next:sfnext-data-fetching` - Loader patterns that feed data to components
- `storefront-next:sfnext-testing` - Writing Vitest tests and Storybook stories
- `storefront-next:sfnext-page-designer` - Page Designer component integration
- `storefront-next:sfnext-i18n` - Translating component text
