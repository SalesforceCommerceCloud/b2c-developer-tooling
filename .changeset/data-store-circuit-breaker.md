---
'@salesforce/mrt-utilities': minor
---

Add an in-memory circuit breaker around data store reads. When DynamoDB is failing or throttling, each warm container trips the breaker and fails fast for a short cooldown instead of piling load onto a saturated table — letting the client's application-level fallback serve reads — then probes to recover. State is per-container and resets on cold start. Set `MRT_DATA_STORE_CIRCUIT_BREAKER_DISABLED=true` to disable it.
