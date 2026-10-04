---
name: sfnext-analytics-consent
description: >-
  Storefront Next analytics: engagement adapters (Einstein, Active Data, Data 360), adding a custom adapter, tracking consent gating, PageViewTracker, useAnalytics events, and first-touch attribution (dw_attribution). Use when configuring engagement.adapters in config.server.ts, writing an adapter with hasConsent, registering it in initializeEngagementAdapters, wiring the consent banner (trackingConsent, consentCategories, dw_dnt), firing trackViewProduct/trackCartItemAdd events, debugging why no analytics events are sent, or passing campaign attribution to orders. Do not use for general config loading or env vars (use `storefront-next:sfnext-configuration`), CSP/script allowlisting of third-party tags (use `storefront-next:sfnext-security`), or SEO meta/JSON-LD (use `storefront-next:sfnext-seo`).
---

# Storefront Next Analytics and Consent

Events flow: component -> `useAnalytics()` -> event mediator (`@salesforce/storefront-next-runtime/events`) -> each registered engagement adapter. Every adapter checks shopper consent before sending. Read `docs/README-ADAPTER-PATTERN-GUIDE.md` and `docs/README-CONSENT-TRACKING.md` in your project for the full guides; where they disagree with the code, trust the code (paths below were verified).

## Where things live

| Concern | Location |
|---|---|
| Adapter config | `engagement.adapters.*` in `config.server.ts` |
| Adapter types, store, `hasConsent`, `buildConsentPreferences` | `@/lib/adapters` (`src/lib/adapters/engagement/`) |
| Registration of built-in adapters | `src/lib/adapters/engagement/register.ts` (`initializeEngagementAdapters`) |
| Built-in adapters | `einstein.ts`, `active-data.ts`, `data360.ts` in the same folder |
| Page view tracking | `src/analytics/page-view-tracker.tsx` (`PageViewTracker`, mounted in `src/root.tsx`) |
| Event hooks | `@/hooks/use-analytics`, `@/hooks/use-tracking-consent` |
| Attribution | `src/lib/attribution.ts`, `@/hooks/use-attribution`, `src/middlewares/attribution-forwarding.server.ts` |

## Configure built-in adapters

```ts
// config.server.ts
engagement: {
  adapters: {
    einstein: { enabled: true, consentCategory: 'analytics', host, einsteinId, realm, siteId, isProduction: false,
                eventToggles: { view_page: true, view_product: true /* ... */ } },
    data360:  { enabled: true, consentCategory: 'analytics', appSourceId, tenantId, siteId, webStoreId: 'sfnext', eventToggles: { /* ... */ } },
    activeData: { enabled: true, /* see config.server.ts */ },
  },
  analytics: {
    trackingConsent: { enabled: true, defaultTrackingConsent: TrackingConsent.Declined,
                       consentCategories: ['necessary', 'analytics', 'marketing', 'personalization'] },
    pageViewsBlocklist: [/* paths that must not emit view_page */],
  },
}
```

- The shipped IDs (einsteinId, realm, tenantId, ...) are sample values. Replace them with your own before go-live, or set `enabled: false`.
- An adapter with `consentCategory: 'analytics'` sends nothing unless `'analytics'` is in `trackingConsent.consentCategories`.
- `eventToggles` turns individual event types on or off per adapter. Data 360 ships only view/impression events enabled.
- The `einstein` and `data360` adapter blocks, and `activeData.enabled` / `activeData.eventToggles`, are protected config paths and cannot be overridden with `PUBLIC__` env vars; edit `config.server.ts` and rebuild. Other keys follow the `PUBLIC__app__engagement__...` pattern (see `storefront-next:sfnext-configuration`).

## Fire events

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

const { trackViewProduct, trackCartItemAdd } = useAnalytics();
```

`useAnalytics` returns `trackViewPage`, `trackViewProduct`, `trackCartItemAdd`, `trackCheckoutStart`, `trackCheckoutStep`, `trackViewSearch`, `trackViewCategory`, `trackClickProductIn{Category,Search,Recommender}`, `trackViewRecommender`, search-suggestion and wishlist trackers. On the server these are no-ops, so call them from effects or event handlers. Check the hook source for exact argument shapes before calling.

## Consent

Consent is read from the auth session (`dw_dnt` cookie) by `useTrackingConsent()`, converted to a `ConsentPreferences` array by `buildConsentPreferences(trackingConsent, consentCategories, isTrackingConsentEnabled)`, and passed to every adapter. While consent is undetermined or declined, no events are sent.

```tsx
import { useTrackingConsent } from '@/hooks/use-tracking-consent';
import { TrackingConsent } from '@/types/tracking-consent';

const { shouldShowBanner, setTrackingConsent } = useTrackingConsent();
setTrackingConsent(TrackingConsent.Accepted);
```

Granular per-category consent (for example from a CMP) means replacing the binary banner logic that feeds `buildConsentPreferences`; adapters already gate per `consentCategory`.

## Add a custom adapter

See [references/CUSTOM-ADAPTER.md](references/CUSTOM-ADAPTER.md). In short: implement `createMyAdapter(config): EngagementAdapter` using `hasConsent`, register it with `addAdapter('my-adapter', ...)` inside `initializeEngagementAdapters`, and add `engagement.adapters.myAdapter` config (the config type allows extra keys).

## Attribution

A first-touch `dw_attribution` cookie captures allow-listed landing/referrer params (see `LANDING_PARAM_ALLOWLIST` in `src/lib/attribution.ts`). `attributionForwardingMiddleware` forwards it on order creation. Add a parameter by extending the allowlist; cookie size is capped (`MAX_ATTRIBUTION_COOKIE_VALUE_LENGTH`).

## Troubleshooting

- No events at all: consent not accepted, `'analytics'` missing from `consentCategories`, adapter `enabled: false`, or the path is in `pageViewsBlocklist`. Startup logs a warning when consent categories are empty.
- Custom adapter never fires: it was not registered in `initializeEngagementAdapters`, or `eventToggles[eventType]` is falsy.
- Third-party script or beacon blocked: CSP, see `storefront-next:sfnext-security`.

## Related Skills

- `storefront-next:sfnext-configuration` - config.server.ts, env overrides
- `storefront-next:sfnext-security` - CSP for analytics endpoints
- `storefront-next:sfnext-authentication` - session/cookies behind `dw_dnt`
- `storefront-next:sfnext-testing` - testing adapters and hooks
- `storefront-next:sfnext-seo` - page metadata and structured data
