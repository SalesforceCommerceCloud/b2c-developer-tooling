---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `code watch` WebDAV lock conflicts by serializing upload and delete operations so only one batch runs at a time. Failed uploads are now retried automatically.
