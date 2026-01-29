# Storefront Next - Development Guidelines (Quick Reference)

⚠️ **READ THESE CRITICAL RULES BEFORE WRITING ANY CODE** ⚠️

## 🏗️ Architecture Overview

This is a **server-rendered SPA** built on React Server Components with:

- **React Router 7** in framework mode
- **Managed Runtime (MRT)** as the data orchestration layer
- **Server-side data fan-out** - All SCAPI requests execute on MRT

### Navigation Pattern

**Initial Page Load (SSR):**
1. Browser requests URL
2. MRT server runs `loader` function
3. SCAPI requests execute on server
4. HTML progressively streamed to browser
5. React hydrates on client

**Subsequent Navigations (Client-Side Routing + Server Data):**
1. Browser intercepts navigation (no page reload)
2. Browser fetches data via XHR/fetch from server
3. MRT server runs `loader` function
4. SCAPI requests still execute on server
5. JSON response sent to browser
6. React updates DOM (no hydration needed)

**Key Point**: Client-side routing does NOT mean client-side data fetching. Loaders still run on the server.

### Key Architectural Decisions

1. **Server-Side Data Orchestration**: MRT is not just a proxy - it's a **data orchestration layer**. All SCAPI requests execute on the server for both initial and subsequent navigations. Parallel/sequential requests are aggregated into single request to MRT and progressively streamed to the client.

2. **React Router Framework Mode**: Enables server-side rendering with data streaming, client-side routing (SPA) with server data fetching, file-based routing, and actions for mutations.

3. **Progressive Streaming**: Loaders should be **synchronous functions that return objects containing promises**, NOT async functions. This enables non-blocking page transitions and streaming SSR.

### Project Structure

```text
src/
├── routes/           # React Router routes with loaders/actions
├── components/       # React components
├── lib/              # Utilities and helpers
├── hooks/            # Custom React hooks
├── middlewares/      # Server/client middleware (auth, i18n)
├── providers/        # React Context providers
├── extensions/       # Modular feature extensions
├── config/           # Configuration system
└── locales/          # i18n translations
```

### Route Conventions

- `_app.*.tsx`: Routes with app layout (header, footer)
- `_empty.*.tsx`: Routes without layout (auth pages)
- `action.*.tsx`: Server-only actions (mutations)
- `resource.*.tsx`: API-like routes returning JSON

---

## 🚨 Non-Negotiable Architecture Rules

### 1. Data Loading Architecture

**Initial Page Load**: Server-Side Rendering (SSR)

- Server runs `loader` functions on MRT
- SCAPI requests execute server-side
- HTML progressively streamed to browser
- React hydrates on client

**Subsequent Navigations**: Client-Side Routing + Server Data Fetching

- Browser handles navigation without page reload (SPA)
- **BUT `loader` functions still fetch data from server** (via XHR/fetch)
- No full page reload, but data requests remain server-side

✅ **REQUIRED**: Use server `loader` for all SCAPI data fetching

```typescript
// ✅ REQUIRED - Server-only data loading
export function loader({ context }: LoaderFunctionArgs): PageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),  // Promise - streams
        reviews: clients.shopperProducts.getReviews({...}),  // Promise - streams
    };
}
```

**Why?** Keeps SCAPI requests on MRT server for security, performance, and bundle size—even during client-side navigation.

### 2. TypeScript-First (JavaScript Blocked)

✅ **REQUIRED**: Use `.ts` and `.tsx` file extensions
❌ **BLOCKED**: `.js`, `.jsx`, `.mjs`, `.cjs` files are forbidden by ESLint

### 3. Progressive Streaming with Suspense

✅ **CRITICAL**: Loaders should be **synchronous functions that return objects containing promises**, NOT async functions.

```typescript
// ✅ CORRECT - Synchronous loader (enables streaming)
export function loader({ context }: LoaderFunctionArgs): PageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),  // Promise - streams
        reviews: clients.shopperProducts.getReviews({...}),  // Promise - streams
    };
}

// ❌ AVOID - Async loaders block page transitions
export async function loader({ context }: LoaderFunctionArgs) {
    const product = await clients.shopperProducts.getProduct({...}); // Blocks!
    return { product };
}
```

**See `data-fetching` section for detailed patterns and explanations.**

### 4. Use createPage() HOC

✅ **RECOMMENDED**: Use `createPage()` for standardized page patterns

```typescript
import { createPage } from '@/components/create-page';

const ProductPage = createPage({
    component: ProductView,
    fallback: <ProductSkeleton />
});

export default ProductPage;
```

## 📋 Quick Patterns

### Data Fetching

```typescript
import { createApiClients } from '@/lib/api-clients';

// ✅ CORRECT - Synchronous loader (enables streaming)
export function loader({ context }: LoaderFunctionArgs): PageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),
        reviews: clients.shopperProducts.getReviews({...}),
    };
}
```

**See `data-fetching` section for comprehensive patterns, actions, and best practices.**

### Authentication

```typescript
import { getAuth } from '@/middlewares/auth.server';

export function loader({ context }: LoaderFunctionArgs) {
    const auth = getAuth(context);

    // Access auth properties
    const accessToken = auth.access_token;
    const customerId = auth.customer_id;
    const isGuest = auth.userType === 'guest';
    const isRegistered = auth.userType === 'registered';

    return { isGuest, customerId };
}
```

### Configuration

```typescript
// In React components
import { useConfig } from '@/config';
const config = useConfig();
const siteName = config.app.site.locale;

// In loaders/actions
import { getConfig } from '@/config';
export function loader({ context }: LoaderFunctionArgs) {
    const config = getConfig(context);
    return { maxItems: config.app.myFeature.maxItems };
}
```

### Internationalization

```typescript
// In React components
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('product');
<h1>{t('title')}</h1>

// In loaders/actions
import { getTranslation } from '@/lib/i18next';
export function loader(args: LoaderFunctionArgs) {
    const { t } = getTranslation(args.context);
    return { title: t('product:title') };
}

// ⚠️  CRITICAL: Use factory pattern for validation schemas
export const createSchema = (t: TFunction) => z.object({
    email: z.string().email(t('validation:emailInvalid'))
});
```

## 🎯 Component Best Practices

### 1. shadcn/ui Components

- ✅ Add via: `npx shadcn@latest add <component-name>`
- ❌ DO NOT manually modify `src/components/ui/` components
- ✅ Create custom components outside this directory

### 2. Suspense Boundaries

```typescript
// ✅ RECOMMENDED - Granular boundaries
<Suspense fallback={<ProductSkeleton />}>
    <Await resolve={product}>
        {(data) => <ProductHeader product={data} />}
    </Await>
</Suspense>
<Suspense fallback={<ReviewsSkeleton />}>
    <Await resolve={reviews}>
        {(data) => <ProductReviews reviews={data} />}
    </Await>
</Suspense>
```

### 3. File Organization

```
src/components/
├── product-card/
│   ├── index.tsx              # Component
│   ├── product-card.test.tsx  # Tests
│   ├── product-card.stories.tsx # Storybook
│   └── skeleton.tsx           # Loading state
```

## ⚡ Performance Tips

1. **Parallel Data Fetching**: Return all promises simultaneously (don't await)
2. **Image Optimization**: Use `<DynamicImage format="webp" />`
3. **Monitor Metrics**: Enable performance metrics in config
4. **Lazy Load**: Use Suspense for below-the-fold content

## 🧪 Testing Requirements

- ✅ Unit tests with Vitest (`.test.ts` / `.test.tsx`)
- ✅ Storybook stories for all reusable components
- ✅ Use viewport toolbar (not separate Mobile/Tablet stories)
- ✅ Test accessibility with a11y addon

## 🔍 Get Specific Guidelines

Use the `storefront_next_development_guidelines` tool with section parameters for detailed guidance:

```
storefront_next_development_guidelines --sections data-fetching
storefront_next_development_guidelines --sections state-management
storefront_next_development_guidelines --sections auth
storefront_next_development_guidelines --sections i18n
storefront_next_development_guidelines --sections page-designer
storefront_next_development_guidelines --sections pitfalls
```

Combine multiple sections for contextual learning:

```
storefront_next_development_guidelines --sections data-fetching --sections components
storefront_next_development_guidelines --sections data-fetching --sections state-management
```

---

**Remember**: These are the critical patterns. When in doubt:

1. Check existing code for similar examples
2. Read the full documentation for your specific use case
3. Follow the architectural principles (server-only, streaming, TypeScript)
