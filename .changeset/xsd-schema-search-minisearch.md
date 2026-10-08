---
'@salesforce/b2c-tooling-sdk': patch
---

XSD schema search now uses the same ranking as docs search and finds compound schema names from spaced queries (for example "gift certificate" or "content slot"). `searchSchemas()` scores are now higher-is-better, matching `searchDocs()`; the `fuse.js` dependency is removed.
