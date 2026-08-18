---
'@salesforce/mrt-utilities': minor
---

Add OpenTelemetry tracing to the data store fetch. `DataStore.getEntry` now emits a client span (`mrt.data_store.getEntry`) around the underlying DynamoDB read, with DynamoDB attributes and found/throttled/error outcome recorded on the span. `@salesforce/mrt-utilities` depends only on `@opentelemetry/api`, so the span joins the host runtime's trace when a tracer provider is registered and is a no-op otherwise — no configuration required from consumers.
