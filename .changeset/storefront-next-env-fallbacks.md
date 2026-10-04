---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Storefront Next variables (`PUBLIC__app__*`, `COMMERCE_API_SLAS_SECRET`) now only fill settings missing from the selected `dw.json` instance, so `-i <instance>` keeps that instance's tenant, short code, site, and SLAS client. A higher-priority source (such as an env file `SFCC_SERVER` or a config plugin) with a different hostname now skips lower-priority sources instead of mixing settings from both. SDK users reading Storefront Next variables through `EnvSource` should add `StorefrontNextEnvSource` after `dw.json`.
