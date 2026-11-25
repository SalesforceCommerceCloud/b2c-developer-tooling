---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add `b2c search` commands to test product search before and after turning on Agentic Commerce Search: `status` checks whether Agentic Commerce Search serves a site, `capture` and `capture-storefront` save the results of a query list from Shopper Search or the storefront search page (hits, prices, totals, refinements, sorting options, and the engine that served each request), `diff` compares two captures, and `analyze` compares up to four captures and lists findings with likely causes, such as storefront products the API does not return. None of them gives a pass or fail verdict. The SDK adds `createShopperSearchClient()` and the `operations/search` module.
