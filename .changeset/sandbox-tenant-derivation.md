---
'@salesforce/b2c-tooling-sdk': patch
---

Tenant/organization IDs are now automatically derived from sandbox patterns (`abcd-001.dx.commercecloud.salesforce.com` → `abcd_001`) when not configured, with a warning when a configured tenant ID doesn't match. Conversely, a sandbox tenant ID with no hostname now derives the hostname, so a Storefront Next project targeting a sandbox works without `SFCC_SERVER`. Sandboxes configured with only a short code can now use SCAPI when `apiBackend` is `auto`. `normalizeTenantId()` now only extracts tenants from sandbox hostnames and returns other dotted values unchanged.
