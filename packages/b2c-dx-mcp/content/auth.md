# Authentication & Session Management

## Architecture

Split-cookie architecture with server/client contexts:

- **Server middleware** (`auth.server.ts`): Manages SLAS tokens, writes cookies
- **Client middleware** (`auth.client.ts`): Reads cookies, maintains cache
- **React Context** (`AuthProvider`): Provides auth state to components

## Cookie Design

| Cookie Name | Purpose | User Type | Expiry | HttpOnly |
|-------------|---------|-----------|--------|----------|
| `cc-nx-g` | Guest refresh token | Guest | 30 days | No |
| `cc-nx` | Registered refresh token | Registered | 90 days | No |
| `cc-at` | Access token | Both | 30 min | No |
| `usid` | User session ID | Both | Matches refresh | No |
| `customerId` | Customer ID | Registered | Matches refresh | No |

**Key Points**:

- Only ONE refresh token exists (guest OR registered, never both)
- User type derived from which refresh token exists
- Cookies auto-namespaced with `siteId`
- Tokens auto-refresh when expired

## Usage in Loaders/Actions

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

## Usage in Components

```typescript
import { useAuth } from '@/providers/auth';

export function MyComponent() {
    const auth = useAuth();

    if (auth?.userType === 'guest') {
        return <LoginPrompt />;
    }

    return <div>Welcome, customer {auth?.customer_id}</div>;
}
```

**Reference:** See README-AUTH.md for complete authentication documentation.
