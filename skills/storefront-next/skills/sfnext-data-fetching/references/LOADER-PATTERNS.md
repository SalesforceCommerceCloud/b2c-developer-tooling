# Loader Patterns Reference

## Data Flow

### Initial Page Load (SSR)

```
Browser request → MRT Server
                  ↓
             loader() runs on server
                  ↓
             SCAPI requests on MRT
                  ↓
             HTML response streamed → Browser
```

### Subsequent Navigation (SPA)

```
User clicks link → React Router intercepts
                   ↓
              Browser fetches from server
                   ↓
              MRT Server runs same loader()
                   ↓
              SCAPI requests on MRT
                   ↓
              JSON response → Browser
                   ↓
              React updates DOM
```

The loader code is identical for SSR and SPA navigation — only the response format differs (HTML vs JSON).

## Decision Tree: Which Pattern to Use

```
Need data for page render?
├── Critical for SEO / above-the-fold?
│   └── Use awaited data (async loader with await)
├── Non-critical / below-the-fold?
│   └── Use deferred data (sync loader, return promises)
└── Mix of both?
    └── Use mixed strategy (await critical, stream rest)

Need to handle mutations?
└── Use action function

Need data after page load (user interaction)?
└── Use useScapiFetcher
```

## Pattern: Multiple API Calls with Dependencies

When one API call depends on another's result:

```typescript
export async function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);

    // First call — must resolve before dependent calls
    const category = await clients.shopperProducts.getCategory({
        params: { path: { id: params.categoryId } }
    }).then(({ data }) => data);

    // Dependent calls — can run in parallel with each other
    return {
        category,
        products: clients.shopperSearch.productSearch({
            params: { query: { refine: `cgid=${category.id}` } }
        }).then(({ data }) => data),
        refinements: clients.shopperSearch.getSearchSuggestions({
            params: { query: { q: category.name } }
        }).then(({ data }) => data),
    };
}
```

## Pattern: Conditional Data Loading

```typescript
export function loader({ params, context }: LoaderFunctionArgs) {
    const clients = createApiClients(context);
    const auth = getAuth(context);

    const base = {
        product: clients.shopperProducts.getProduct({
            params: { path: { id: params.productId } }
        }).then(({ data }) => data),
    };

    // Only fetch wishlist for registered users
    if (auth.userType === 'registered') {
        return {
            ...base,
            wishlist: clients.shopperCustomers.getWishlist({...}).then(({ data }) => data),
        };
    }

    return base;
}
```
