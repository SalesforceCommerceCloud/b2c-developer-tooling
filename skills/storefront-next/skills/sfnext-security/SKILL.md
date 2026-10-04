---
name: sfnext-security
description: >-
  Configure Storefront Next security response headers, Content Security Policy (CSP), CSP contributors, Cloudflare Turnstile bot protection, and the shared cookie domain. Use for "Refused to load the script/connect/image" CSP violations, adding a third-party origin, app.security.headers, defaultCspDirectives, csp reportOnly rollout, writing a CSP contributor under src/middlewares/csp-contributors, HSTS or Permissions-Policy, Turnstile widget or enforceTurnstile, TURNSTILE_SECRET_KEYS, log-only rollout, or app.cookies.domain across subdomains. Do not use for auth tokens, cookie names or login flows (use `storefront-next:sfnext-authentication`), SFRA proxy routing (use `storefront-next:sfnext-hybrid-storefronts`), or consent banners and tracking (use `storefront-next:sfnext-analytics-consent`).
---

# Storefront Next Security

Security is configured under `app.security` in `config.server.ts`: `security.headers` for response headers and CSP, `security.turnstile` for bot protection. Cookie sharing is `app.cookies.domain`. Your project ships deeper docs: `docs/README-SECURITY-HEADERS.md`, `docs/README-TURNSTILE.md`, `docs/README-COOKIE-DOMAIN.md`. Read them for details; this skill is the task guide.

## Default headers

Every storefront gets these with no opt-in, from `@salesforce/storefront-next-runtime/security` via the `securityHeadersMiddleware` in `src/middlewares/security-headers.server.ts`:

| Header | Default |
|---|---|
| `Content-Security-Policy` | Strict, nonce-based (no `'unsafe-inline'` scripts, no `'unsafe-eval'`) |
| `Strict-Transport-Security` | Sent on Managed Runtime only, suppressed locally |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

The CSP directive table (which origins `script-src`, `connect-src`, `img-src`, and `frame-src` allow by default) is in `docs/README-SECURITY-HEADERS.md`. The per-request nonce is read in `root.tsx` and must be forwarded to any inline `<script>` you render (for example the JSON-LD component takes a `nonce` prop).

## Allow a new third-party origin

The violation message names the directive to extend ("Refused to connect to ..." means `connect-src`). Spread the defaults, because **each directive you set fully replaces the default**:

```ts
// config.server.ts
import { defaultCspDirectives } from '@salesforce/storefront-next-runtime/security';

security: {
    headers: {
        csp: {
            directives: {
                ...defaultCspDirectives,
                'script-src': [...defaultCspDirectives['script-src']!, 'https://cdn.example.com'],
                'connect-src': [...defaultCspDirectives['connect-src']!, 'https://api.example.com'],
            },
        },
    },
},
```

Use exact origins, not wildcards. Do not load third-party scripts synchronously in the document head; load them after interaction or idle (see `storefront-next:sfnext-performance`).

Env-var override is awkward for directives (names contain hyphens, and a JSON override replaces the whole map). Use `config.server.ts` for directives and env vars for toggles:

```bash
PUBLIC__app__security__headers__csp__reportOnly=true
PUBLIC__app__security__headers__hsts=false
```

## Roll out or relax safely

- Migrating or adding many origins: set `csp: { reportOnly: true }`, watch DevTools violations, extend the directives, then remove `reportOnly`. A startup warning is logged while it is on.
- Disable one header with `hsts: false` or `permissionsPolicy: false`. `headers: { enabled: false }` disables everything; use it for debugging only. A startup warning is logged whenever any header is disabled.

## CSP contributors

A contributor lets a feature add its own exact origins to the CSP at boot instead of hand-editing directives. Shipped examples in `src/middlewares/csp-contributors/`: `cimulate.ts` (Shopper Agent widget, active when enabled in config), `data360.ts` (`connect-src` for the tenant ingestion host), and `openstreetmap.ts` (a deliberate no-op; replace it to permit map tiles).

Shape (see `data360.ts` for the smallest real one):

```ts
import type { CspContributor, CspContribution } from '@salesforce/storefront-next-runtime/security';
import { toCspOrigin } from './to-csp-origin.js';

export function createMyFeatureCspContributor(cfg: { enabled?: boolean; apiUrl?: string } | undefined): CspContributor {
    const origin = cfg?.apiUrl ? toCspOrigin(cfg.apiUrl) : null;
    return {
        id: 'my-feature',
        isActive: () => cfg?.enabled === true && origin !== null,
        contribute: (): CspContribution => (origin ? { 'connect-src': [origin] } : {}),
    };
}
```

Then add it to the `contributors` array in `src/middlewares/security-headers.server.ts`. Rules:

- Derive origins from config you already have; `toCspOrigin` returns `null` for unsafe values.
- The runtime validates contributors at boot: https only, no wildcards, no credentials, no whitespace.
- Contribute only while the feature is active, so disabled features never widen the policy.
- Add a colocated `*.test.ts` like the shipped ones.

Use a contributor for a feature toggled by config; use the `defaultCspDirectives` spread for one-off origins.

## Turnstile bot protection

Cloudflare Turnstile guards passwordless email, checkout registration, and order lookup. It is **fail-open** on Cloudflare outages (so a Turnstile incident never blocks checkout) and fail-closed on real bot signals (forged, replayed, or missing tokens).

Config (`config.server.ts`, overridable with `PUBLIC__` env vars): `security.turnstile.enabled`, `mode` (`managed`, `non-interactive`, `invisible`), `sites` (per-site site keys), and `verification.mode` (`enforce`, `log-only`, `disabled`).

| Variable | Purpose |
|---|---|
| `TURNSTILE_SECRET_KEYS` | JSON map of site key to secret key. Server-only. Required for `enforce` and `log-only` |
| `PUBLIC__app__security__turnstile__enabled` | Master switch; when false the widget never renders |
| `PUBLIC__app__security__turnstile__sites` | JSON per-site keys |
| `PUBLIC__app__security__turnstile__verification__mode` | `enforce`, `log-only`, `disabled` |

Rollout: deploy with `verification.mode` set to `log-only`, read the logs for `would_block`, then switch to `enforce`. Shoppers start without a `cc-tv_<siteId>` attestation cookie after the switch, which is expected.

Add protection to a new server action by rendering `TurnstileWidget` (`src/components/security/turnstile-widget.tsx`) in the form and calling `enforceTurnstile` (`src/lib/turnstile/enforce.server.ts`) in the action before doing work. Pass `request`, `config`, `turnstileToken`, `logger`, `actionName`, `email`, and `turnstileCookieName`; set the `cc-tv` cookie from the returned `cookieValue` when it is non-null. Copy an existing caller such as `src/routes/action.authorize-passwordless-email.ts`. Cloudflare test keys and a manual test matrix: [references/TURNSTILE.md](references/TURNSTILE.md).

## Cookie domain

Cookies are host-only by default. To share them across subdomains or with SFRA, set `app.cookies.domain` (or `commerce.sites[].cookies.domain` per site; env `PUBLIC__app__cookies__domain=.example.com`) **and** match Business Manager: Site Preferences, Hybrid Auth Settings, cookie-domain level `0` for host-only, `2` for the first-level parent domain. Level `1` is rejected. A mismatch silently breaks sessions. Full checklist: [references/COOKIE-DOMAIN.md](references/COOKIE-DOMAIN.md).

## Pitfalls

| Symptom | Cause / fix |
|---|---|
| Added origin to `script-src` and other scripts broke | You replaced the directive. Spread `defaultCspDirectives['script-src']` first |
| Inline script blocked | Missing `nonce`. Read it from root loader data and pass it on |
| CSS/JS fail on local Safari after enabling your own `upgrade-insecure-requests` | The default suppresses it locally for a reason; keep the default |
| Login does not stick after setting `cookies.domain` | Domain is not a parent of the serving host, or Business Manager level mismatches |
| Turnstile widget never appears | Expected when Cloudflare says no challenge is needed (`interaction-only`); check network tab and `cc-tv_<siteId>` |
| Everything blocked in Turnstile tests | Secret keys missing in `TURNSTILE_SECRET_KEYS` for the configured site key |

## Related Skills

- `storefront-next:sfnext-authentication` - cookies, sessions, login flows that Turnstile protects
- `storefront-next:sfnext-hybrid-storefronts` - SFRA proxy and `dwsid` session bridge
- `storefront-next:sfnext-configuration` - `config.server.ts` and `PUBLIC__` overrides
- `storefront-next:sfnext-performance` - loading third-party scripts safely
- `storefront-next:sfnext-analytics-consent` - tracking consent and analytics adapters
- `storefront-next:sfnext-deployment` - Managed Runtime environment variables
