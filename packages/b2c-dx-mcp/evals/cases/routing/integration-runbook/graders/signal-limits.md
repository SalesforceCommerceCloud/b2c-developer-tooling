---
type: llm
---

PASS if the response uses or plans to use per-host outbound call metrics (call volume, p95 latency, or remote exceptions such as read timeouts) to date and classify the failure, and relies on service logs or configuration (not metrics) for HTTP status or error detail.
FAIL if the response claims the metrics show HTTP status codes or the service ID, names a root cause without evidence, or says it changed a service, cartridge or configuration.
