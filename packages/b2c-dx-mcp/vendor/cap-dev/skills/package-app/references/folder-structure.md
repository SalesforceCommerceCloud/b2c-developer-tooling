# Folder Structure Reference

Commerce apps must follow a strict folder structure for installation to work correctly.

## Required pattern

```
{domain}/{appName}/
├── {appName}-v{version}.zip    # The packaged app
└── catalog.json                 # Version tracking (new apps only)
```

Where:
- `{domain}` = one of: tax, payment, shipping, gift-cards, ratings-and-reviews, loyalty, search, address-verification, analytics, approaching-discounts, fraud
- `{appName}` = the app id (kebab-case, matches commerce-app.json "id" field)
- `{version}` = semantic version (e.g., 1.0.0, 0.2.8)

## Why this matters

Installation fetches from GitHub using this URL pattern:
```
https://raw.githubusercontent.com/{owner}/{repo}/{tag}/{domain}/{appName}/{zipFileName}
```

If the folder structure doesn't match `{domain}/{appName}/`, installation will fail with 404 errors.

## Common mistakes

❌ **Wrong:** `payment/stripe-inc/stripe-payments/`
✅ **Right:** `payment/stripe-payments/`

❌ **Wrong:** `tax/vendor-name/avalara-tax/`
✅ **Right:** `tax/avalara-tax/`

❌ **Wrong:** `loyalty/apps/acme-loyalty/`
✅ **Right:** `loyalty/acme-loyalty/`

## Validation

Check that:
1. App is at `{domain}/{appName}/` where `{appName}` matches the "id" in manifest.json
2. No extra directory nesting (no vendor folders, no "apps" subfolder)
3. Domain is valid (one of the 11 domains listed above)
