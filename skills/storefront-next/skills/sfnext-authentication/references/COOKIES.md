# Storefront Next Auth Cookies

Source of truth in your project: `docs/README-AUTH.md` (Cookie Architecture) and the constants in `src/middlewares/auth.utils.ts`. Cookie serialization lives in `src/lib/cookie-utils.server.ts` (`getCookieConfig`, `createCookie`).

All auth cookies are `HttpOnly`, so client JavaScript cannot read them. The only exception is `dw_dnt` (the consent banner reads it). The browser still sends every cookie on each request, which is what lets the server middleware and a hybrid B2C Commerce (SFRA) storefront read them.

| Cookie | Purpose | User type | Lifetime | Notes |
|---|---|---|---|---|
| `cc-nx-g` | Guest refresh token | Guest | Guest refresh expiry (max 30 days) | Mutually exclusive with `cc-nx` |
| `cc-nx` | Registered refresh token | Registered | Registered refresh expiry (max 90 days) | Written on login; deletes `cc-nx-g` |
| `cc-at` | Access token | Both | JWT `exp` | Refreshed by middleware |
| `usid` | SLAS user session id (JWT `sub`) | Both | Refresh expiry, else access expiry | Keep httpOnly; never expose to JS |
| `enc_user_id` | Encoded user id | Registered | Refresh expiry | Needed for some SLAS calls |
| `idp_access_token` | Social-login IDP access token | Both | Access expiry | Social login only |
| `id_token` | OIDC ID token | Both | Access expiry | |
| `idp_refresh_token` | Social-login IDP refresh token | Both | Refresh expiry | |
| `dw_dnt` | Tracking consent (value is the `TrackingConsent` enum) | Both | Session | Not httpOnly, not site-namespaced; cookie is the source of truth |
| `dwsid` | B2C Commerce session id (hybrid bridge) | Both | Session | Not site-namespaced; taken from the SLAS `Set-Cookie` header |
| `cc-cv` | PKCE code verifier | Both | 5 minutes | Social login flow |
| `cc-auth-recover` | 401 / session-expiry redirect loop guard | Both | 30 seconds | Set by middleware, cleared on follow-up request |

Related non-auth cookies you may see: `cc-tv_<siteId>` (Turnstile attestation, 30 min, see `storefront-next:sfnext-security`), `glo_order_*` / `glo_cd_*` (guest order lookup), site-context cookies for site, locale and currency, a JS-readable `__sfdc_usertype_<siteId>` hint that carries only guest/registered so cached app-shell HTML can restore header state, and a JS-readable basket snapshot cookie. The hint and basket cookies never carry tokens.

## Rules

- **Namespacing.** Cookies are suffixed with the site id (for example `cc-nx_RefArch`) so multi-site deployments do not collide. `dwsid` and `dw_dnt` are deliberately excluded (`COOKIE_NAMESPACE_EXCLUSIONS`) so B2C Commerce and external scripts can read them.
- **No `userType` cookie.** It is derived from the access-token JWT (`rcid` claim means registered). The refresh-cookie name is only a cold-start fallback and a write-time decision about which refresh cookie to set or delete.
- **No `customerId` cookie.** Derived from the JWT. A legacy `customer_id` cookie is only deleted on logout and error paths.
- **Value source.** Token strings come from the SLAS token response body; `userType`, `customerId`, `usid`, expiry and consent are decoded from the JWT so they cannot drift from the token. `dwsid` is the exception (SLAS `Set-Cookie`).
- **Expiry overrides.** `PUBLIC_COMMERCE_API_GUEST_REFRESH_TOKEN_EXPIRY_SECONDS` and `PUBLIC_COMMERCE_API_REGISTERED_REFRESH_TOKEN_EXPIRY_SECONDS` can shorten the refresh lifetime; values above 30 / 90 days are capped.
- **Defaults.** `path: '/'`, `sameSite: 'lax'`, `secure` only on deployed HTTPS (gated on `isRemote()`); `SameSite=None` cookies used by Page Designer design mode always stay `Secure`. The resolved `app.cookies.domain` (or per-site `commerce.sites[].cookies.domain`) applies to every cookie the storefront writes.
- **Never write auth cookies directly.** Use `updateAuth` / `destroyAuth`; the middleware owns serialization and deletes cookies with expired `Set-Cookie` headers.

## Debugging checklist

1. DevTools > Application > Cookies: do you see duplicates of the same name (host-only plus domain-scoped)? See cookie-domain rollout notes in `storefront-next:sfnext-security`.
2. Login works but does not stick on Safari over `http://localhost`: `secure` cookies are refused; confirm you are on `pnpm dev`/`pnpm preview` (which write non-secure cookies) and not a tunnel or HTTPS proxy with mismatched host.
3. Hybrid pages lose the session: confirm `dwsid` is present on both storefronts and the cookie-domain settings agree on both sides.
4. Repeated `session_expired` redirects: check the SLAS client's refresh-token settings and that the cookie domain matches the serving host.
