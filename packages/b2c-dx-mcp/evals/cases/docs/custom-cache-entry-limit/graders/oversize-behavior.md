---
type: llm
---

The answer states all of the following about an oversized value returned by the loader: it is not stored in the cache, `Cache.get(key, loader)` still returns the value to the caller, a message is written to the custom warn log, and no exception is thrown. FAIL if it claims an exception is thrown, that the value is truncated, or that `get` returns null/undefined.
