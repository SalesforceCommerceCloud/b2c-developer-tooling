---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `b2c search capture` and `b2c search diff` to capture Shopper Search product search results for a list of queries and compare two captures query by query: overlap at each depth, products only one side returned, rank changes, refinement and refinement hit count changes, sorting options, the order of hit prices, and the search mode that served each request. With Agentic Commerce Search turned on, `--search-mode lexical` and `--search-mode semantic` capture both engines on the same site, and `--sort` and `--refine` apply a sort and refinements to every query to check that each engine applies them. `b2c search capture-storefront` captures the storefront search results page in the same format, reading the product tiles and their prices, the result count, filters, and sorting options from the page HTML (SFRA selectors by default, `--profile` for customized templates), so `search diff` also compares what shoppers see with what the API returns. The SDK adds `createShopperSearchClient()` and the `operations/search` module (`captureProductSearch()`, `captureStorefrontSearch()`, `parseStorefrontSearchPage()`, `diffSearchCaptures()`, and `priceOrderOf()`). A new `b2c-search` skill covers the workflow.
