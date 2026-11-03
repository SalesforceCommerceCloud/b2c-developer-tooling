---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added `b2c object-types` to inspect and manage system object type attribute definitions and attribute groups (for example, add a custom attribute to Product) without a site import, using the SCAPI Object Definitions API. `object-types export` and `object-types apply` move definitions to and from `system-objecttype-extensions.xml`, so you can snapshot an instance or apply an import set's metadata without an import job. Add `--import` to also set enum values and default values, which the API can't write, with a site import of just those attributes.
