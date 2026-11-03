---
'@salesforce/b2c-tooling-sdk': minor
---

`READ_ONLY` Safety Mode now allows known search endpoints (such as product, job execution, and attribute definition searches) that use POST but don't change data, so read-only sessions and assistants can search without extra rules. Configured rules still take precedence.
