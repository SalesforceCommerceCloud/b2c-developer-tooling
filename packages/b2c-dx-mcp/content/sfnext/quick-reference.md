# Storefront Next - Development Guidelines (Quick Reference)

⚠️ **READ THESE CRITICAL RULES BEFORE WRITING ANY CODE** ⚠️

## 🏗️ Architecture Overview

**Server-rendered SPA** built on React Server Components:
- **React Router 7** in framework mode
- **Managed Runtime (MRT)** as data orchestration layer
- **All SCAPI requests execute on MRT server** (both SSR and client-side navigation)

**Key Point**: Client-side routing does NOT mean client-side data fetching. Loaders always run on the server.

---

## 🚨 Non-Negotiable Rules

### 1. Server-Only Data Loading

✅ **REQUIRED**: Use server `loader` for all SCAPI data fetching

```typescript
export function loader({ context }: LoaderFunctionArgs): PageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),  // Promise - streams
        reviews: clients.shopperProducts.getReviews({...}),  // Promise - streams
    };
}
```

**Why?** Keeps SCAPI requests on MRT server for security, performance, and bundle size.

### 2. Synchronous Loaders (Not Async)

✅ **CRITICAL**: Loaders must be **synchronous functions that return promises**, NOT async functions.

```typescript
// ✅ CORRECT - Enables streaming
export function loader({ context }: LoaderFunctionArgs): PageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),  // Promise - streams
    };
}

// ❌ AVOID - Blocks page transitions
export async function loader({ context }: LoaderFunctionArgs) {
    const product = await clients.shopperProducts.getProduct({...}); // Blocks!
    return { product };
}
```

**Why?** Async loaders block page transitions. Synchronous loaders enable progressive streaming.

### 3. TypeScript-Only

✅ **REQUIRED**: Use `.ts` and `.tsx` file extensions  
❌ **BLOCKED**: `.js`, `.jsx`, `.mjs`, `.cjs` files are forbidden by ESLint

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

### 5. Tailwind CSS 4 Only

✅ **REQUIRED**: Use Tailwind utility classes only  
❌ **BLOCKED**: No inline styles (`style={{...}}`), no CSS modules, no separate CSS files

```typescript
// ✅ CORRECT - Tailwind utilities
<div className="rounded-lg border border-border bg-card p-4">
    <h2 className="text-lg font-semibold text-card-foreground">
        {product.name}
    </h2>
</div>

// ❌ AVOID - Inline styles
<div style={{ padding: '1rem' }}>

// ❌ AVOID - CSS modules
import styles from './product-card.module.css';
```

**Why?** Consistent styling approach, better performance, automatic dark mode support via theme variables.

---

## 📋 Quick Patterns

### Data Fetching

```typescript
import { createApiClients } from '@/lib/api-clients';

export function loader({ context }: LoaderFunctionArgs): PageData {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({...}),
        reviews: clients.shopperProducts.getReviews({...}),
    };
}
```

**See `data-fetching` section for:** loaders, actions, useScapiFetcher, parallel requests, data flow

### Authentication

```typescript
import { getAuth } from '@/middlewares/auth.server';

export function loader({ context }: LoaderFunctionArgs) {
    const auth = getAuth(context);
    return { 
        isGuest: auth.userType === 'guest',
        customerId: auth.customer_id 
    };
}
```

**See `auth` section for:** cookie architecture, client usage, token management

### Configuration

```typescript
// Components
import { useConfig } from '@/config';
const config = useConfig();

// Loaders/Actions
import { getConfig } from '@/config';
const config = getConfig(context);
```

**See `config` section for:** adding config, environment variables, security

### Internationalization

```typescript
// Components
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('product');

// Loaders/Actions
import { getTranslation } from '@/lib/i18next';
const { t } = getTranslation(context);
```

**See `i18n` section for:** validation schemas (factory pattern), language switching, extensions

### Components

```typescript
// Suspense boundaries
import { Suspense } from 'react';
import { Await } from 'react-router';

<Suspense fallback={<ProductSkeleton />}>
    <Await resolve={product}>
        {(data) => <ProductHeader product={data} />}
    </Await>
</Suspense>
```

**See `components` section for:** createPage HOC, file organization, best practices

### Styling

```typescript
// Tailwind utility classes
<div className="bg-background text-foreground border-border">
    <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">
        Click me
    </button>
</div>

// shadcn/ui: Add via npx shadcn@latest add <component-name>
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

**See `styling` section for:** Tailwind CSS 4 rules, Shadcn/ui components, dark mode, responsive design

---

## 🔍 Get Detailed Guidelines

Use the `sfnext_get_guidelines` MCP tool with specific sections:

```json
{
  "sections": ["data-fetching", "components", "testing"]
}
```

**Available sections:**
- `data-fetching` - Loaders, actions, useScapiFetcher, data flow
- `components` - createPage HOC, Suspense, file organization
- `styling` - Tailwind CSS 4, Shadcn/ui, styling guidelines
- `testing` - Vitest, Storybook, coverage requirements
- `auth` - Authentication and session management
- `config` - Configuration system
- `i18n` - Internationalization patterns
- `state-management` - Client-side state with Zustand
- `page-designer` - Page Designer integration
- `performance` - Optimization techniques
- `extensions` - Extension development
- `pitfalls` - Common mistakes to avoid

---

**When in doubt:**
1. Check existing code for similar examples
2. Use the MCP tool to get detailed section guidance
3. Follow architectural principles: server-only, streaming, TypeScript
