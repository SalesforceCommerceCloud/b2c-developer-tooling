---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `active: true` on `configs[]` instances being ignored unless the root object also has `active: false`
