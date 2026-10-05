---
name: sfnext-commerce-features
description: >-
  Catalogue and router for optional Storefront Next commerce features: Shopper Context (qualifiers, source codes), Order Management returns/cancel/tracking (SOM/OMS), delivery estimates, feature stubs (@feature-stub), guest order lookup, the app_storefrontnext_base email cartridge, and the shipped extensions (bnpl, bopis, multiship, store-locator, ratings-reviews, customer-preferences, product-content, shipping-delivery, theme-switcher). For each: which flag, SLAS scope, Business Manager setting, cartridge, or extension registry entry it needs, and which in-project doc to read. Use when asked how to enable a feature, why a feature does not render, what prerequisites a feature has, or which stubs are mock data. Do not use for building a new extension (use `storefront-next:sfnext-extensions`), config loading (use `storefront-next:sfnext-configuration`), or SLAS login flows (use `storefront-next:sfnext-authentication`).
---

# Storefront Next Commerce Features

Start with the feature table, then read the named doc in your project's `docs/` folder. Do not assume a feature is live: several ship as UI scaffolds with mock data (see Feature stubs).

## Feature table

| Feature | Enable with | Also needs | Read |
|---|---|---|---|
| Shopper Context | `features.shopperContext.enabled` (env: `PUBLIC__app__features__shopperContext__enabled=true`), default off | Shopper Context API access for the SLAS client; qualifiers arrive as URL params or via the `useShopperContext` hook, stored in cookies | `docs/README-SHOPPER-CONTEXT.md` |
| Returns, cancel, tracking (Order Management) | Nothing to toggle | Salesforce Order Management connected to the B2C instance; order loader expands `['oms','oms_shipments']`; without `omsData` only tracking shows | `docs/README-ORDER-MANAGEMENT.md` |
| Delivery estimates | Keep extension `SFDC_EXT_SHIPPING_DELIVERY` installed | SLAS scopes `sfcc.shopper-delivery-estimates` and `sfcc.shopper-standard`, a delivery-estimate Commerce App bound to `sfcc.app.shipping.estimate`, online products on the site | `docs/README-DELIVERY-ESTIMATES.md` |
| Guest order lookup | `guestOrderLookup.enabled: true` in `config.server.ts` | `GUEST_ORDER_LOOKUP_COOKIE_SECRET` (or `CLIENT_SECRET` fallback) and a cartridge implementing hook `sfcc.app.order.sendOrderAccessCode` to email the code | `docs/README-GUEST-ORDER-LOOKUP.md` |
| Email cartridge (`app_storefrontnext_base`) | Deploy cartridge, add to site cartridge path | SLAS scope `c_sfnext_notify` (`sfnext setup-base-cartridge --slas-client-id <id>`), import preference metadata, set `Storefront Hosts` global custom preference, callback mode in storefront config | `docs/README-EMAIL-CARTRIDGE.md` |
| Feature stubs | n/a | Mock UI scaffolds, not integrations | `docs/README-FEATURE-STUBS.md` |

## Extensions shipped in src/extensions

Registry: `src/extensions/config.json` (keys `SFDC_EXT_*`). Each extension contributes components to `UITarget` points through its `target-config.json`. To install or remove one, follow the install/uninstall instructions in `instructions/*.mdc` when the registry entry references them; building new extensions is `storefront-next:sfnext-extensions`.

| Extension | Registry key | Notes |
|---|---|---|
| Store Locator | `SFDC_EXT_STORE_LOCATOR` | Find stores by location. Guided install/uninstall in `instructions/`. |
| Multiship | `SFDC_EXT_MULTISHIP` | Ship items to several addresses in one order. Guided install/uninstall. |
| Buy Online Pickup In Store | `SFDC_EXT_BOPIS` | Depends on Store Locator and Multiship. Guided install/uninstall. |
| Shipping and Delivery | `SFDC_EXT_SHIPPING_DELIVERY` | Registers `sfcc.pdp.estimatedDelivery`; see delivery estimates row. |
| Buy Now Pay Later (demo) | `SFDC_EXT_BNPL` | Mock fixtures; `sfcc.pdp.bnpl.message` target. Replace API function bodies to integrate a provider. |
| Ratings and Reviews (demo) | `SFDC_EXT_RATINGS_REVIEWS` | Mock fixtures for PDP, cart modal, order detail CTA. Integrate Bazaarvoice, PowerReviews, etc. by replacing API bodies. |
| Product Content (demo) | `SFDC_EXT_PRODUCT_CONTENT` | Returns/warranty card, FAQ, collapsibles (`sfcc.pdp.returnsWarranty`, `sfcc.pdp.faq`, `sfcc.pdp.collapsibles`). Fixtures in `lib/api/product-content.server.ts`. |
| Customer Preferences (demo) | `SFDC_EXT_CUSTOMER_PREFERENCES` | Interests/preferences on the account page. Mock data. |
| Theme switcher | none in registry | Folder `src/extensions/theme-switcher` has no registry entry in the shipped project; check your project before relying on it. |

Demo extensions are "(Demo)" in `config.json`. Treat them as reference implementations: read the extension `README.md` and replace fixture functions before go-live.

## Feature stubs

Working UI with no backend (express checkout buttons, BNPL, returns and warranty, customer interests, and others). Find all of them:

```bash
grep -r "@feature-stub" src/
```

Each marker explains how to strip or wire it. Review the list before launch so mock content does not ship.

## Decision flow when "the feature is not showing"

1. Flag off? (`shopperContext`, `guestOrderLookup`) - check `config.server.ts` and env overrides.
2. Extension missing from `src/extensions/config.json`, or dependencies not installed (BOPIS needs Store Locator and Multiship)?
3. Missing SLAS scope on the shopper client (see `storefront-next:sfnext-authentication`)? Confirm in your SLAS client config, then re-login to get a fresh token.
4. Backend not configured: OMS not connected, Commerce App not bound, cartridge not on the site cartridge path.
5. Result is mock data: it is a stub.

More detail per group: [references/FEATURE-PREREQUISITES.md](references/FEATURE-PREREQUISITES.md).

## Related Skills

- `storefront-next:sfnext-extensions` - UITarget, target-config.json, authoring extensions
- `storefront-next:sfnext-configuration` - feature flags and env overrides
- `storefront-next:sfnext-authentication` - SLAS scopes and clients
- `storefront-next:sfnext-scapi` - calling the backing SCAPI endpoints
- `storefront-next:sfnext-deployment` - deploying cartridges and bundles
- `b2c-cli:b2c-mrt` - Managed Runtime environment variables
