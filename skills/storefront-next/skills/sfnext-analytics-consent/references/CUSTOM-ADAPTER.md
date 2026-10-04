# Writing a custom engagement adapter

Verify the types in `src/lib/adapters/engagement/types.ts` in your project first.

## 1. Implement

```ts
// src/lib/adapters/engagement/my-adapter.ts
import { hasConsent, type EngagementAdapter, type EngagementAdapterConfig } from '@/lib/adapters';
import type { AnalyticsEvent, ConsentPreferences, EventSiteInfo } from '@salesforce/storefront-next-runtime/events';

export function createMyAdapter(config: EngagementAdapterConfig): EngagementAdapter {
  return {
    name: 'my-adapter',
    sendEvent: async (event: AnalyticsEvent, siteInfo?: EventSiteInfo, consentPreferences?: ConsentPreferences) => {
      if (!hasConsent(config.consentCategory, consentPreferences)) return;
      if (!config.eventToggles[event.eventType]) return;
      navigator.sendBeacon('https://example.com/collect', JSON.stringify({ event, siteInfo }));
    },
  };
}
```

`hasConsent(category, prefs)` is in `src/lib/adapters/engagement/utils.ts`; read it for the behavior when `category` is undefined.

## 2. Register

In `src/lib/adapters/engagement/register.ts`, inside `initializeEngagementAdapters(appConfig)`:

```ts
const mine = appConfig?.engagement?.adapters?.myAdapter;
if (mine?.enabled) {
  addAdapter('my-adapter', createMyAdapter({ consentCategory: mine.consentCategory, eventToggles: mine.eventToggles || {}, ...mine }));
}
```

Follow the try/catch and logger pattern used for the built-in adapters.

## 3. Configure

Add `engagement.adapters.myAdapter: { enabled: true, consentCategory: 'marketing', eventToggles: { view_page: true } }` in `config.server.ts`. Add `'marketing'` (or your category) to `trackingConsent.consentCategories`.

## 4. Allow the endpoint in CSP

Beacons to a new host need `connect-src` (and script hosts need `script-src`). See `storefront-next:sfnext-security`.

## 5. Test

Unit-test the adapter with and without consent (see the `*.test.ts` files beside the built-in adapters for the pattern).
