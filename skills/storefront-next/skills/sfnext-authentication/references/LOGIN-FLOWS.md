# Login Flows

All flows end in `updateAuth(context, tokenResponse)` from `@/middlewares/auth.server`. Prefer the existing route and library code over new implementations:

| Flow | Entry points in your project |
|---|---|
| Password login | `src/routes/_empty.login.tsx`, `src/lib/api/auth/standard-login.server.ts` |
| Registration | `src/routes/_empty.signup.tsx`, `src/lib/api/auth/register.server.ts` |
| Password reset | `src/routes/_empty.reset-password.tsx`, `action.request-password-reset.ts`, `resource.slas-reset-password-callback.ts`, `src/lib/api/auth/reset-password.server.ts` |
| Passwordless / OTP | `action.authorize-passwordless-email.ts`, `action.verify-passwordless-otp.ts`, `action.otp-request.ts`, `action.otp-verify.ts`, `resource.slas-passwordless-login-callback.ts`, `src/lib/auth/passwordless-login.server.ts` |
| Social login | `src/lib/api/auth/social-login.server.ts` |
| Passkeys | `action.passkey-*.ts`, `resource.passkey-status.ts`, `_app.account.passkeys.tsx`, `src/components/passkeys/`, `src/lib/auth/passkey-support.ts`, `webauthn.ts` |
| Guest order lookup | `_app.order-lookup.*`, `action.order-lookup-*.ts`, `src/lib/order/` |

Auth helpers used by these flows (`authorizePasswordless`, `getPasswordLessAccessToken`, `requestOtp`, `verifyOtp`, `getPasswordResetToken`, `resetPasswordWithToken`, passkey start/finish functions) are exported from `@/middlewares/auth.server`.

## Passwordless (magic link) and OTP

- Enable in `config.server.ts` under `features.passwordlessLogin` (`enabled`, `mode: 'email' | 'callback'`, `callbackUri` default `/passwordless-login-callback`, `landingUri` default `/login`). The callback URL must be allowlisted in the SLAS client. The callback route takes no site/locale prefix so one SLAS entry covers all sites.
- Requires a SLAS **private** client: set `commerce.api.privateKeyEnabled: true`. If it is `false`, passwordless is disabled at runtime regardless of other settings.
- `features.otpRequest.mode`: `email` (SLAS sends the code; supports email verification) or `callback` (SLAS POSTs the code to your `callbackUri` and you deliver it; no email-verification UI). `auth.otpLength` must be 6 or 8 and match the SLAS client.
- Email verification UI (verified badge, change email, passwordless registration) turns on with the Business Manager preference **Enable Email Verification** (Site Preferences > Storefront Login Preferences; up to 5 minutes to propagate). Changing login email also needs **Enable Loginid Updates for SCAPI** (request via Salesforce support) and B2C 24.7 or later.
- Full detail and troubleshooting table: `docs/README-EMAIL-VERIFICATION.md`.

## Email delivery (email cartridge)

Magic links, password resets and OTPs are sent by the `app_storefrontnext_base` cartridge's `POST /notify` custom API, called server-side via `clients.sfnextNotify` (`src/lib/notify/notify.server.ts`). One-time setup:

1. `sfnext setup-base-cartridge --slas-client-id <id>` registers the `c_sfnext_notify` scope on the SLAS client (idempotent; needs `SFCC_SHORTCODE`, `SFCC_TENANT_ID` and OAuth client credentials).
2. Deploy the cartridge (`pnpm cartridge:deploy --reload`) and add `app_storefrontnext_base` to the site cartridge path.
3. Complete the Business Manager steps in `docs/README-EMAIL-CARTRIDGE.md` (storefront host allowlist preference, etc.).

To change how mail is sent, customize the cartridge's `sendNotification` helper rather than the storefront. Deploy and endpoint registration checks: `b2c-cli:b2c-code`, `b2c-cli:b2c-scapi-custom`.

## Social login

- Enable `features.socialLogin` (`enabled`, `providers`, `callbackUri` default `/social-callback`). Each provider also needs setup in Account Manager / SLAS.
- Flow is authorization-code with PKCE: generate the challenge, store the verifier via `updateAuth(context, (cur) => ({ ...cur, codeVerifier }))` (lands in httpOnly `cc-cv`, 5 minutes), redirect to the IDP, exchange the code in the callback and call `updateAuth(context, tokenResponse)`.
- Adding a provider beyond the defaults usually needs CSP changes (`connect-src`, redirect/popup origins): see `storefront-next:sfnext-security`.
- Guest wishlist/basket must be captured before and merged after the token swap; copy the shape of `social-login.server.ts`.
- In a hybrid setup add `^/social-callback.*` to `HYBRID_ROUTING_RULES` (see `storefront-next:sfnext-hybrid-storefronts`).

## Passkeys

Enable with `features.passkey.enabled`. Registration is authorized by an OTP whose delivery follows `features.passkey.mode` (`email` or `callback`, same allowlisting rules as above). Passkeys are managed on `/account/passkeys`.

## Guest order lookup

Lets a guest find an order by order number plus email, confirm a 6-digit access code (valid 15 minutes, fixed by SCAPI) and view a redacted read-only order.

- Set `guestOrderLookup.enabled: true` (default `false`). When off, both pages 404 and the actions return `FEATURE_DISABLED`.
- Set `GUEST_ORDER_LOOKUP_COOKIE_SECRET` (falls back to `CLIENT_SECRET`); without a secret the feature fails closed with `CONFIGURATION_ERROR`.
- Implement the B2C Commerce hook `sfcc.app.order.sendOrderAccessCode(order, accessCode)` in a cartridge; the storefront never sends this email itself (the shipped email cartridge covers it).
- `guestOrderLookup.allowedFields` is an allow-list applied to the order before it reaches the browser; `cooldownSeconds` and `orderNumberPattern` tune abuse controls. Turnstile is enforced on the request-code step only (`guestOrderLookup.turnstile`).
- Full detail: `docs/README-GUEST-ORDER-LOOKUP.md`.

## Bot protection on login

The passwordless/OTP email step, checkout registration and order lookup can be gated with Cloudflare Turnstile. Configuration and rollout are in `storefront-next:sfnext-security`.
