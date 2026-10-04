---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Storefront Next variables (`PUBLIC__app__*`, `COMMERCE_API_SLAS_SECRET`) now only fill settings missing from the selected `dw.json` instance, so `-i <instance>` keeps that instance's tenant, short code, site, and SLAS client. An env file `SFCC_SERVER` with a different hostname now skips the `dw.json` entry instead of mixing settings from both.
