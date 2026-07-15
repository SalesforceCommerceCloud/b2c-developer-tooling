---
'@salesforce/b2c-tooling-sdk': patch
---

Fix dead 404 links in the Developer Center guides documentation corpus. The guides index now includes only pages that are published on developer.salesforce.com (referenced from a guide table-of-contents), removing 105 orphaned entries whose URLs returned 404 in `b2c docs search`/`docs read`.
