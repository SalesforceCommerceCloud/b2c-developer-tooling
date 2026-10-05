---
name: sfnext-authentication
description: >-
  Work with Storefront Next's server-only authentication and session architecture (SLAS guest/registered tokens, httpOnly cookies, auth.server.ts middleware). Use for getAuth, useAuth, updateAuth, destroyAuth, protecting account routes, login/logout actions, guest-to-registered basket/wishlist merge, "session expired" redirects, 401 recovery loops, cc-at/cc-nx/usid/dwsid cookies, cookie names or expiry, passwordless login, social login, OTP email verification, passkeys, guest order lookup, or refresh-token lifetime settings. Do not use for Turnstile, CSP headers or cookie-domain config (use `storefront-next:sfnext-security`), calling SCAPI clients (use `storefront-next:sfnext-scapi`), or sharing sessions with SFRA (use `storefront-next:sfnext-hybrid-storefronts`).
---

# Storefront Next Authentication

Authentication is **server-only**. One middleware (`src/middlewares/auth.server.ts`, registered in the `middleware` array of `src/root.tsx`) runs on every request: it reads cookies, validates or refreshes the SLAS access token, performs a guest login when nothing usable exists, and writes `Set-Cookie`. Tokens never reach the browser. Components only see a small non-sensitive slice through `useAuth()`.

Read `docs/README-AUTH.md` in your project for the full reference; this skill is the task-oriented summary. Route modules use server `loader`/`action` only, never `clientLoader`/`clientAction`.

## Request flow

1. Valid access token (JWT `exp` in the future): use it.
2. Expired access token with a refresh token: refresh, rewrite `cc-at`.
3. No tokens: guest login.
4. Registered shopper whose refresh fails: 307 to `/login?returnUrl=<path>&error=session_expired` (site/locale prefix included) and a fresh guest session is created in parallel. Guests are silently re-issued a guest session.
5. A SCAPI call returning 401 throws `AuthTokenInvalidError`; the middleware clears state, re-runs login/refresh and 307-redirects to the same URL. The short-lived `cc-auth-recover` cookie (30 s) prevents loops.

User type comes from the access-token JWT (registered tokens carry an `rcid` claim), not from which cookie exists. `customerId` is **not** a cookie; it is derived per request from the JWT.

## Read auth on the server

```typescript
import { getAuth } from '@/middlewares/auth.server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ context }: LoaderFunctionArgs) {
    const auth = getAuth(context); // full SessionData, server only
    const isRegistered = auth.userType === 'registered';
    return { isRegistered };       // never return auth.accessToken / refreshToken
}
```

## Read auth in components

```tsx
import { useAuth } from '@/providers/auth';

function AccountBadge() {
    const auth = useAuth(); // PublicSessionData | undefined
    return auth?.userType === 'registered' ? <span>Welcome back</span> : <SignInLink />;
}
```

`PublicSessionData` is exactly `customerId`, `userType`, `usid`, `encUserId`, `trackingConsent`. The root loader derives it with `getPublicSessionData` (from `@/middlewares/auth.utils`) and passes it to `AuthProvider`; there is no client `getAuth`.

## Protect a route

Branch inside the server loader. Prefer the existing account layout (`src/routes/_app.account.tsx`) for anything under `/account` instead of adding per-route checks.

```typescript
import { redirect } from 'react-router';
import { getAuth } from '@/middlewares/auth.server';
import { buildUrlFromContext } from '@/lib/url.server';
import { routes } from '@/route-paths';

export async function loader({ context }: LoaderFunctionArgs) {
    if (getAuth(context).userType !== 'registered') {
        throw redirect(buildUrlFromContext(routes.login, context)); // keeps site/locale prefix
    }
    // ...
}
```

## Log in and out

Never write auth cookies yourself. Use the helpers exported from `@/middlewares/auth.server`:

```typescript
import { loginRegisteredUser, updateAuth } from '@/middlewares/auth.server';

export async function action({ request, context }: ActionFunctionArgs) {
    const form = await request.formData();
    const tokens = await loginRegisteredUser(context, String(form.get('email')), String(form.get('password')));
    updateAuth(context, tokens);            // re-derives userType/customerId/usid, swaps cc-nx-g for cc-nx
    return redirect('/account');
}
```

`updateAuth` accepts a SLAS token response or an updater function (`updateAuth(context, (cur) => ({ ...cur, codeVerifier }))`). Logout: `destroyAuth(context)` clears every auth cookie on the response; the shipped `src/routes/_empty.logout.ts` also calls `clients.auth.logout` and `destroyBasket`. Prefer `src/lib/api/auth/standard-login.server.ts` and `social-login.server.ts` over hand-rolled flows: they already handle the merge below.

Other exported helpers: `loginGuestUser`, `refreshAccessToken`, `authorizePasswordless`, `getPasswordLessAccessToken`, `getPasswordResetToken`, `resetPasswordWithToken`, `requestOtp`, `verifyOtp`, `flashAuth(context, message)` (clear session plus an error message), `clearInvalidSessionAndRestoreGuest(context)` (deleted customer or corrupted session).

## Guest to registered merge

`customerId` changes from the guest `gcid` to the registered `rcid` at the token swap, and SCAPI rejects the guest id under the registered token. So: snapshot guest-owned data (wishlist) **before** the swap, then `mergeBasket` and `mergeWishlist` **after**. `src/lib/api/auth/social-login.server.ts` is the reference implementation. `dw_dnt` tracking consent is preserved across the swap.

## Common SCAPI calls for account data

These are real operations: `clients.shopperCustomers.getCustomerOrders`, `getCustomerProductLists` (wishlists), `getCustomer`. Use the existing helpers (`src/lib/api/order.server.ts`, `wishlist.server.ts`, `customer.server.ts`) rather than calling clients directly. Client setup and the `@/lib/api-clients.server` import are covered in `storefront-next:sfnext-scapi`.

## Configuration

| Setting | Where |
|---|---|
| Refresh-token lifetime | `PUBLIC_COMMERCE_API_GUEST_REFRESH_TOKEN_EXPIRY_SECONDS` (max 30 days), `PUBLIC_COMMERCE_API_REGISTERED_REFRESH_TOKEN_EXPIRY_SECONDS` (max 90 days) |
| Feature flags | `features.passwordlessLogin`, `features.passkey`, `features.socialLogin`, `features.otpRequest`, `auth.otpLength` in `config.server.ts` |
| Private SLAS client | `commerce.api.privateKeyEnabled` (required for passwordless / OTP) |
| Cookie domain | `app.cookies.domain` (see `storefront-next:sfnext-security`) |

`secure` on cookies is only set on deployed (HTTPS) environments; local `pnpm dev` over `http://localhost` writes non-secure cookies so Safari keeps them.

## Pitfalls

- Reading tokens with `document.cookie`: impossible by design (httpOnly). Use `useAuth()` or loader data.
- Returning `getAuth(context)` from a loader leaks tokens into the page. Return only derived values.
- Refreshing tokens manually in routes: the middleware already does it.
- Logging `accessToken` or `refreshToken`: never.
- Changing the cookie domain on a live site leaves old host-only cookies shadowing new ones; roll out in a quiet window.
- A loop of redirects to `/login?error=session_expired` usually means refresh tokens are being rejected (SLAS client config, or cookie domain mismatch between hosts).

## References

- [COOKIES.md](references/COOKIES.md): full cookie inventory, namespacing, expiry, hints.
- [LOGIN-FLOWS.md](references/LOGIN-FLOWS.md): passwordless, social, OTP, passkeys, password reset, guest order lookup, email cartridge prerequisites.
- In your project: `docs/README-AUTH.md`, `docs/README-EMAIL-VERIFICATION.md`, `docs/README-GUEST-ORDER-LOOKUP.md`, `docs/README-EMAIL-CARTRIDGE.md`.

## Related Skills

- `storefront-next:sfnext-security` - Turnstile bot protection, CSP for social providers, cookie domain
- `storefront-next:sfnext-scapi` - SCAPI clients and custom APIs
- `storefront-next:sfnext-hybrid-storefronts` - shared `dwsid` session bridge with SFRA
- `storefront-next:sfnext-analytics-consent` - `dw_dnt` tracking consent
- `storefront-next:sfnext-configuration` - `config.server.ts` and `PUBLIC__` overrides
- `b2c-cli:b2c-slas` - manage SLAS clients and scopes
