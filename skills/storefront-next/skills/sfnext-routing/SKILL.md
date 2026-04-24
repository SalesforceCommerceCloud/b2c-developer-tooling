---
name: sfnext-routing
description: Implement file-based routing in Storefront Next with React Router 7. Use when adding new pages, creating layout routes, defining route parameters, or understanding route module exports (loader, action, component, meta). Covers flat-routes conventions, nested layouts, and the _app prefix.
---

# Routing Skill

This skill covers React Router 7 file-based routing in Storefront Next projects.

## Overview

Storefront Next uses React Router 7 in framework mode with flat-routes file conventions. Route files live in `src/routes/` and file names map directly to URL paths using dot (`.`) separators for nesting.

## Route File Conventions

### File Name to URL Mapping

| File Name | URL Path | Notes |
|-----------|----------|-------|
| `_app.tsx` | — | Layout route (wraps child routes) |
| `_app._index.tsx` | `/` | Home page (index of `_app` layout) |
| `_app.product.$productId.tsx` | `/product/:productId` | Dynamic parameter |
| `_app.category.$categoryId.tsx` | `/category/:categoryId` | Dynamic parameter |
| `_app.cart.tsx` | `/cart` | Static route |
| `_app.account.tsx` | `/account` | Layout for account pages |
| `_app.account.orders.tsx` | `/account/orders` | Nested under account layout |

### Naming Rules

- **Dots (`.`)** create path segments: `_app.product.tsx` maps to `/product`
- **`$` prefix** marks dynamic parameters: `$productId` becomes `:productId`
- **`_` prefix** marks layout routes (pathless): `_app.tsx` wraps children without adding a URL segment
- **`_index`** matches the parent path exactly (index route)

See [Route Conventions Reference](references/ROUTE-CONVENTIONS.md) for the complete naming rules.

## Route Module Exports

Each route file can export these values:

### loader — Server-side data loading

```typescript
import { createApiClients } from '@/lib/api-clients';
import type { LoaderFunctionArgs } from 'react-router';

export function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    return {
        product: clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),
    };
}
```

### action — Handle mutations (form submissions)

```typescript
import { data, redirect } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request, context }: ActionFunctionArgs) {
    const formData = await request.formData();
    // Handle mutation...
    return data({ success: true });
}
```

### default — Page component

Components receive `loaderData` as props from the framework:

```typescript
import { Suspense } from 'react';
import { Await } from 'react-router';
import { SeoMeta } from '@/components/seo-meta';

export default function CategoryPage({ loaderData }: { loaderData: CategoryPageData }) {
    // `category` is already resolved (awaited in loader)
    // `products` is a Promise (streamed)
    return (
        <>
            <SeoMeta
                title={loaderData.category.name}
                description={loaderData.category.pageDescription}
            />
            <h1>{loaderData.category.name}</h1>
            <Suspense fallback={<ProductGridSkeleton />}>
                <Await resolve={loaderData.products}>
                    {(products) => <ProductGrid products={products} />}
                </Await>
            </Suspense>
        </>
    );
}
```

For SEO metadata, use the `<SeoMeta />` component inside your page component (not a `meta` export).

## Layout Routes

Layout routes wrap child routes with shared UI (navigation, footer, etc.):

```typescript
// src/routes/_app.tsx — Main app layout
import { Outlet } from 'react-router';

export default function AppLayout() {
    return (
        <div>
            <Header />
            <main>
                <Outlet />  {/* Child routes render here */}
            </main>
            <Footer />
        </div>
    );
}
```

### Adding a New Page

1. Create a route file in `src/routes/`:
   ```
   src/routes/_app.wishlist.tsx    →  /wishlist
   ```

2. Export a `loader` for data and `default` for the component:
   ```typescript
   import { createApiClients } from '@/lib/api-clients';
   import { SeoMeta } from '@/components/seo-meta';
   import type { LoaderFunctionArgs } from 'react-router';

   type WishlistPageData = {
       wishlist: Promise<Wishlist>;
   };

   export function loader({ context }: LoaderFunctionArgs): WishlistPageData {
       const clients = createApiClients(context);
       return {
           wishlist: clients.shopperCustomers.getWishlist({...}).then(({ data }) => data),
       };
   }

   export default function WishlistPage({ loaderData }: { loaderData: WishlistPageData }) {
       return (
           <>
               <SeoMeta title="My Wishlist" />
               <Suspense fallback={<WishlistSkeleton />}>
                   <Await resolve={loaderData.wishlist}>
                       {(wishlist) => <div>{/* Render wishlist */}</div>}
                   </Await>
               </Suspense>
           </>
       );
   }
   ```

## Resource Routes

Routes that return data (no UI component):

```typescript
// src/routes/resource.api.client.$resource.tsx
// Used by useScapiFetcher to execute SCAPI calls server-side
export function loader({ params, context }: LoaderFunctionArgs) {
    // Decode params, call SCAPI, return JSON
}
```

## Related Skills

- `storefront-next:sfnext-data-fetching` - What happens inside loader and action functions
- `storefront-next:sfnext-components` - Building page components with createPage
- `storefront-next:sfnext-page-designer` - Page Designer routes with regions

## Reference Documentation

- [Route Conventions Reference](references/ROUTE-CONVENTIONS.md) - Complete naming rules and examples
