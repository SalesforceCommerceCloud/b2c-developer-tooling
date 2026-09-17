---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': patch
---

`b2c code deploy` now discovers cartridges in pwa-kit and storefront-next repositories that use `cartridge/<name>.properties` instead of `.project` files. The `.project` marker remains primary; the properties fallback is only used when no `.project` files are found.
