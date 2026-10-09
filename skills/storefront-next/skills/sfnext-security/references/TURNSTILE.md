# Turnstile reference

Deep design lives in `docs/README-TURNSTILE.md` in your project. Quick facts:

## Modules

- `src/components/security/turnstile-widget.tsx` - client widget (`siteKey`, `onSuccess`, `onError`, `onExpire`, `onTimeout`, `onBypass`). Mounts with `appearance: 'interaction-only'`, so it is hidden unless Cloudflare needs shopper input.
- `src/lib/turnstile/enforce.server.ts` - `enforceTurnstile` and `resolveVerificationMode`.
- `src/lib/turnstile/constants.ts` - cookie base name `cc-tv` (written as `cc-tv_<siteId>`, 30 minute TTL).

## Enforcement points

`action.authorize-passwordless-email`, `action.initiate-checkout-registration`, the order-lookup request-code action, and the passwordless submit and OTP resend on the login route. The OTP verification actions rely on the earlier challenge plus the code itself.

## Fail-open vs fail-closed

Open (request allowed, logged at warn): siteverify network failure or 5xx, `internal-error`, sustained elevated failure rate, CDN probe failure, client script timeout. Closed: `invalid-input-response`, `timeout-or-duplicate`, missing token while Cloudflare looks healthy, origin mismatch, misconfigured site key.

## Verification mode

| Value | Behavior |
|---|---|
| `enforce` | Blocks failures |
| `log-only` | Runs full verification, only logs `would_block`; no shopper blocked, no `cc-tv` cookie issued |
| `disabled` | Skips verification |

`TURNSTILE_VERIFICATION_ENABLED` is deprecated; use `PUBLIC__app__security__turnstile__verification__mode`. `TURNSTILE_CDN_PROBE_URL` overrides the health probe URL for tests.

## Cloudflare test keys (local development)

| Site key | Secret key | Behavior |
|---|---|---|
| `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` | Always passes, silent |
| `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` | Always blocks, silent |
| `3x00000000000000000000FF` | `1x0000000000000000000000000000000AA` | Forces an interactive challenge (only visible widget) |

Set the site key in `security.turnstile.sites` and `TURNSTILE_SECRET_KEYS` to a JSON map of site key to secret key. The passwordless login form only renders when the `emailVerificationEnabled` site preference is on (Business Manager, Storefront Login Preferences); see `docs/README-TURNSTILE.md` for seeding it locally.

## Manual checks

- Interactive key `3x...FF` with a passing secret: widget appears, then the OTP modal opens.
- Always-block key: no widget, a generic "We couldn't verify your information" alert, no OTP modal.
- Block `challenges.cloudflare.com` locally: no widget, flow continues (graceful degradation).
