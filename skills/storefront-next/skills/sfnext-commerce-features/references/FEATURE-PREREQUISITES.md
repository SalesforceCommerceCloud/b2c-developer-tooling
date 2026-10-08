# Feature prerequisites checklist

Verify each item in your project; these come from the shipped docs and config.

## Shopper Context
- Flag: `features.shopperContext.enabled` (default false). When off, the middleware makes no SCAPI calls.
- Qualifiers come from URL query params (middleware) or `useShopperContext`; state persists in cookies and is sent to SCAPI as a full replace.
- Customizing supported qualifiers: `docs/README-SHOPPER-CONTEXT.md` "Customization".

## Order Management
- No flag. Needs SOM connected; the order detail loader calls `shopperOrders.getOrder` with `expand: ['oms', 'oms_shipments']`.
- Return/cancel render only for registered, owning shoppers with item-level availability (`omsData.quantityAvailableToReturn > 0`).
- ECOM-only orders degrade to tracking.

## Delivery estimates
- SLAS scopes: `sfcc.shopper-delivery-estimates`, `sfcc.shopper-standard`.
- Commerce App provider bound to `sfcc.app.shipping.estimate`.
- API `403`/`500` falls back to merchant shipping-method descriptions as general guidance only.
- Verify by requesting an estimate for a product and destination; troubleshooting section in the doc.

## Guest order lookup
- Flag `guestOrderLookup.enabled`; keys include `orderNumberPattern`, `cooldownSeconds`, `allowedFields`.
- Cookie secret env var required or the feature fails closed.
- Access code lifetime is set by SCAPI, email is sent by your hook implementation.
- When disabled: page routes 404 and action routes return `FEATURE_DISABLED`.

## Email cartridge
1. `sfnext setup-base-cartridge --slas-client-id <id>` (idempotent; reads `SFCC_SHORTCODE`, `SFCC_TENANT_ID`, `SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET` or `dw.json`).
2. Deploy: `pnpm cartridge:deploy` (script runs `sfnext deploy-cartridge`). The email-cartridge doc shows a different command spelling; prefer the script in your `package.json`.
3. Add `app_storefrontnext_base` to the site cartridge path; import the preference metadata; set the `Storefront Hosts` preference to your MRT hostnames.
4. Set callback mode and callback URIs in storefront config; register the matching URLs in SLAS.
Also see `storefront-next:sfnext-deployment`.

## Extensions
- Registry entries list `dependencies` (BOPIS -> Store Locator, Multiship).
- Store Locator, Multiship, BOPIS ship install/uninstall `.mdc` instructions in `instructions/`. Additional BM or backend setup for them is not documented in a single place; check the instructions and each extension folder.
- Demo extensions use fixtures; replace the API function bodies before production.
