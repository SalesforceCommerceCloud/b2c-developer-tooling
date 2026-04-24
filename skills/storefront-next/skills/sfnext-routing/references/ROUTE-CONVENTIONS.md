# Route Conventions Reference

## Flat Routes File Naming

Storefront Next uses React Router 7's flat-routes convention where dots (`.`) in file names create URL path segments.

### Syntax Reference

| Syntax | Purpose | Example File | URL |
|--------|---------|-------------|-----|
| `.` | Path separator | `_app.product.tsx` | `/product` |
| `$param` | Dynamic segment | `_app.product.$id.tsx` | `/product/:id` |
| `_prefix` | Pathless layout | `_app.tsx` | (no URL segment) |
| `_index` | Index route | `_app._index.tsx` | `/` (parent path) |

### Common Route Patterns

```
src/routes/
├── _app.tsx                           # Layout: wraps all /app routes
├── _app._index.tsx                    # /
├── _app.product.$productId.tsx        # /product/:productId
├── _app.category.$categoryId.tsx      # /category/:categoryId
├── _app.cart.tsx                      # /cart
├── _app.checkout.tsx                  # /checkout
├── _app.account.tsx                   # Layout: wraps /account routes
├── _app.account._index.tsx            # /account
├── _app.account.orders.tsx            # /account/orders
├── _app.account.orders.$orderId.tsx   # /account/orders/:orderId
├── _app.search.tsx                    # /search
├── _auth.tsx                          # Layout: auth pages
├── _auth.login.tsx                    # /login
├── _auth.register.tsx                 # /register
└── resource.api.client.$resource.tsx  # Resource route (no UI)
```

### Layout Nesting

```
URL: /account/orders/12345

Route hierarchy:
  _app.tsx                    (layout — renders Header, Footer, <Outlet />)
    _app.account.tsx          (layout — renders account sidebar, <Outlet />)
      _app.account.orders.$orderId.tsx  (page — renders order details)
```

## Route Module Exports

| Export | Type | When It Runs | Purpose |
|--------|------|-------------|---------|
| `loader` | Function | Server (SSR + SPA navigation) | Load data |
| `action` | Function | Server (form submissions) | Handle mutations |
| `default` | Component | Client + Server | Render UI |
| `meta` | Function | Server | Set page title, description, OG tags |
| `handle` | Object | Client + Server | Attach route metadata |
| `ErrorBoundary` | Component | Client + Server | Error UI for this route |
| `headers` | Function | Server | Set HTTP response headers |

## Important Notes

- All loaders run on the server, both during SSR and client-side navigation
- Route files must be `.tsx` (TypeScript with JSX) — JavaScript files are forbidden
- The `_app` prefix is a pathless layout; it does not add `/app` to the URL
- Resource routes (no default export) return data only, no rendered HTML
