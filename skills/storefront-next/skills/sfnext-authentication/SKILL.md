---
name: sfnext-authentication
description: Implement authentication in Storefront Next using split-cookie architecture, SLAS tokens, and auth middleware. Use when accessing user identity in loaders, detecting guest vs registered users, using getAuth or useAuth, or understanding session management and token refresh.
---

# Authentication Skill

This skill covers Storefront Next's split-cookie authentication architecture with SLAS (Shopper Login and API Access Service).

## Overview

Storefront Next uses a split-cookie architecture separating server and client auth concerns:

- **Server middleware** (`auth.server.ts`) — Manages SLAS tokens, writes cookies, handles token refresh
- **React Context** (`AuthProvider`) — Provides public session data (non-sensitive fields) to components via `useAuth()`

## Cookie Design

| Cookie | Purpose | User Type | Expiry | HttpOnly |
|--------|---------|-----------|--------|----------|
| `cc-nx-g` | Guest refresh token | Guest | 30 days | No |
| `cc-nx` | Registered refresh token | Registered | 90 days | No |
| `cc-at` | Access token | Both | 30 min | No |
| `usid` | User session ID | Both | Matches refresh | No |
| `customerId` | Customer ID | Registered | Matches refresh | No |

**Key points:**
- Only ONE refresh token exists at a time (guest OR registered, never both)
- User type is derived from which refresh token is present
- Cookies are auto-namespaced with `siteId`
- Tokens auto-refresh when expired

## Usage in Loaders/Actions

```typescript
import { getAuth } from '@/middlewares/auth.server';

export function loader({ context }: LoaderFunctionArgs) {
    const auth = getAuth(context);

    const { accessToken, customerId, userType } = auth;
    const isGuest = userType === 'guest';
    const isRegistered = userType === 'registered';

    return { isGuest, customerId };
}
```

## Usage in Components

```typescript
import { useAuth } from '@/providers/auth';

export function MyComponent() {
    const auth = useAuth();

    if (auth?.userType === 'guest') {
        return <LoginPrompt />;
    }

    return <div>Welcome, customer {auth?.customerId}</div>;
}
```

## Common Patterns

### Protected Routes

```typescript
export function loader({ context }: LoaderFunctionArgs) {
    const auth = getAuth(context);

    if (auth.userType === 'guest') {
        throw redirect('/login');
    }

    const clients = createApiClients(context);
    return {
        orders: clients.shopperOrders.getOrders({
            params: { path: { customerId: auth.customerId } }
        }).then(({ data }) => data),
    };
}
```

### Conditional Data Loading

```typescript
export function loader({ context }: LoaderFunctionArgs) {
    const auth = getAuth(context);
    const clients = createApiClients(context);

    const base = {
        products: clients.shopperProducts.getProducts({...}).then(({ data }) => data),
    };

    if (auth.userType === 'registered') {
        return {
            ...base,
            wishlist: clients.shopperCustomers.getWishlist({...}).then(({ data }) => data),
        };
    }

    return base;
}
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `auth` is undefined | Missing auth middleware | Ensure `auth.server.ts` middleware is configured |
| Always guest | Refresh token expired | Check cookie expiry; SLAS auto-refreshes |
| Token errors in SCAPI | Stale access token | Tokens auto-refresh; check SLAS client configuration |

## Related Skills

- `storefront-next:sfnext-data-fetching` - Using auth context in loader functions
- `storefront-next:sfnext-configuration` - SLAS client configuration
- `storefront-next:sfnext-hybrid-storefronts` - Session bridging with SFRA
