---
type: llm
---

PASS if the response uses the store redirect mappings API bulk upsert (`upsertStoreRedirectMappings` or equivalent) with siteId, notes the bulk response only reports counts (or may skip unknown IDs), and verifies afterwards by reading each mapping or listing the mappings.
FAIL if the response treats the bulk call's success alone as confirmation, omits verification by read, or claims the redirects were created.
