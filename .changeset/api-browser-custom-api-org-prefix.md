---
'b2c-vs-extension': patch
---

Fix VS Code API Browser handling of Custom APIs and shopper-named system APIs. Custom APIs now show endpoint paths with the required `/organizations/{organizationId}/...` prefix, and the Shopper/Admin classification is now derived from the spec's declared security schemes (ShopperToken / AmOAuth2 / BearerToken) rather than the API family name — fixing token selection for shopper-named APIs that live under non-shopper families (e.g. `product/shopper-products`, `checkout/shopper-baskets`) and for Custom APIs which can be either type. Resolves #453.
