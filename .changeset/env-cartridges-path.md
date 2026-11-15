---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

`SFCC_CARTRIDGES`, `SFCC_CATALOGS`, `SFCC_LIBRARIES`, `SFCC_ASSET_QUERY`, and `SFCC_DOCS_CATEGORIES` now apply to every CLI command, not only `setup` commands. `SFCC_CARTRIDGES` also accepts a colon-separated cartridge path, as copied from Business Manager.
