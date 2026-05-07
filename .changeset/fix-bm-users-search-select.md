---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `bm users search` returning only `login` and `link` fields. The underlying SDK `searchBmUsers()` now sends `select=(**)` (matching `listBmUsers()`), so `--sort-by`, `--columns`, and the default table now work as expected. A new `select` option is also exposed for callers that want a narrower projection.
