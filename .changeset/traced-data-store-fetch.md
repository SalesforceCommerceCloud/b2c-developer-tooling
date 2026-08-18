---
'@salesforce/mrt-utilities': minor
---

Add OpenTelemetry tracing to the data store fetch. `DataStore.getEntry` now emits a client span (`mrt.data_store.getEntry`) around the underlying read, recording only backend-neutral outcome signals (found / throttled) and a generic error status — no storage-backend implementation detail is exposed on the span, since traces may be customer-visible. `@salesforce/mrt-utilities` depends only on `@opentelemetry/api`, so the span joins the host runtime's trace when a tracer provider is registered and is a no-op otherwise — no configuration required from consumers.
