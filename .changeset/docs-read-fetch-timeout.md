---
'@salesforce/b2c-tooling-sdk': patch
---

Bound the online documentation fetch (Developer Center guides read via `docs_read`) with a 10s timeout. Previously a stalled or unreachable connection would hang the read indefinitely; it now falls back to the indexed offline summary once the timeout elapses.
