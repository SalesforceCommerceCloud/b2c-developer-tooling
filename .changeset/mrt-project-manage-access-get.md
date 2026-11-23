---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `b2c mrt project manage-access get` to show whether a storefront is managed in Runtime Admin or Business Manager, whether the SCAPI MRT Admin API is available, and whether direct (legacy) MRT API access is allowed, along with the environments/instances these settings apply to. The SDK adds `getStorefrontManageAccess()`.
