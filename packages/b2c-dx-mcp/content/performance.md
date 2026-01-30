# Performance Optimization

## Bundle Size Limits

The application enforces strict bundle size limits defined in `package.json` under the `bundlesize` configuration. Refer to `package.json` for the complete list of limits.

**Check bundle size:**

```bash
pnpm bundlesize:test      # Verify limits
pnpm bundlesize:analyze   # Analyze composition
```

## Built-in Metrics

Enable in `config.server.ts`:

```typescript
{
    performance: {
        metrics: {
            serverPerformanceMetricsEnabled: true,
            clientPerformanceMetricsEnabled: true,
            serverTimingHeaderEnabled: false  // Debug only
        }
    }
}
```

Tracks:

- SSR operations and rendering time
- SCAPI API calls with parallelization
- Authentication operations
- Client-side navigations

## Best Practices

### 1. Parallel Data Fetching

**Key principle:** Return all promises simultaneously in loaders to enable parallel requests. Avoid sequential `await` calls.

**Reference:** See `data-fetching` section for detailed parallel vs sequential patterns and code examples.

### 2. Image Optimization

Use the `DynamicImage` component with WebP format:

```typescript
import { DynamicImage } from '@/components/dynamic-image';

<DynamicImage
    src={product.image.link}
    alt={product.image.alt}
    width={400}
    height={400}
    format="webp"  // Default format
/>
```

### 3. Progressive Streaming

**Key principle:** Use synchronous loaders returning promises to enable progressive streaming. Await only critical data, stream the rest.

**Reference:** See `data-fetching` section for detailed streaming patterns including mixed strategies (awaited + streamed).

### 4. Lighthouse Audits

Monitor performance metrics:

- Preload critical CSS
- Use WebP images by default
- Lazy load below-the-fold content
- Optimize font loading

```bash
pnpm lighthouse:ci   # Run Lighthouse CI
```

**Reference:** See README-PERFORMANCE.md for complete performance optimization documentation.
