---
name: sfnext-performance
description: Optimize Storefront Next performance with bundle size limits, DynamicImage component, Lighthouse audits, and progressive streaming. Use when checking bundle sizes, optimizing images, improving page load speed, or configuring performance metrics. Covers parallel data fetching, image optimization, and performance monitoring.
---

# Performance Skill

This skill covers performance optimization techniques for Storefront Next storefronts.

## Bundle Size Limits

The application enforces strict bundle size limits in `package.json` under the `bundlesize` configuration.

```bash
pnpm bundlesize:test      # Verify bundle stays within limits
pnpm bundlesize:analyze   # Analyze bundle composition
```

## Built-in Metrics

Enable performance tracking in `config.server.ts`:

```typescript
{
    performance: {
        metrics: {
            serverPerformanceMetricsEnabled: true,
            clientPerformanceMetricsEnabled: true,
            serverTimingHeaderEnabled: false  // Enable for debugging only
        }
    }
}
```

Tracks:
- SSR operations and rendering time
- SCAPI API calls with parallelization visibility
- Authentication operations
- Client-side navigation timing

## Parallel Data Fetching

Return all promises simultaneously in loaders — avoid sequential `await`:

```typescript
// GOOD — Parallel (all requests start at once)
export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),
        reviews: clients.shopperProducts.getReviews({...}),
        recommendations: clients.shopperProducts.getRecommendations({...}),
    };
}

// BAD — Sequential (each waits for previous)
export async function loader({ context }: LoaderFunctionArgs) {
    const product = await clients.shopperProducts.getProduct({...});
    const reviews = await clients.shopperProducts.getReviews({...});
    return { product, reviews };
}
```

## Image Optimization

Use the `DynamicImage` component with WebP format:

```typescript
import { DynamicImage } from '@/components/dynamic-image';

<DynamicImage
    src={product.image.link}
    alt={product.image.alt}
    width={400}
    height={400}
    format="webp"
/>
```

### Image Best Practices

- Use WebP format by default (smaller file sizes)
- Set explicit `width` and `height` to prevent layout shifts
- Lazy load below-the-fold images
- Use SCAPI image alt text as the primary alt source

## Progressive Streaming

Use synchronous loaders returning promises to stream data progressively:

```typescript
// Streams data as each promise resolves
export function loader({ context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),    // Streams independently
        reviews: clients.shopperProducts.getReviews({...}),    // Streams independently
    };
}
```

Combine with granular Suspense boundaries for progressive page rendering.

## Lighthouse Optimization

Monitor and improve performance metrics:

```bash
pnpm lighthouse:ci   # Run Lighthouse CI
```

**Key areas:**
- Preload critical CSS
- Use WebP images by default
- Lazy load below-the-fold content
- Optimize font loading
- Minimize JavaScript bundle size

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Large bundle size | Unused imports or heavy dependencies | Run `bundlesize:analyze`; tree-shake or lazy load |
| Slow page transitions | Async loaders blocking | Use synchronous loaders returning promises |
| Layout shifts | Missing image dimensions | Set `width` and `height` on images |
| Slow SCAPI responses | Sequential API calls | Use parallel data fetching |

## Related Skills

- `storefront-next:sfnext-data-fetching` - Parallel loader patterns for performance
- `storefront-next:sfnext-components` - Suspense boundaries for progressive rendering
- `storefront-next:sfnext-deployment` - Production build optimization
