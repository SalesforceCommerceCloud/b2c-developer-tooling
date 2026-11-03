---
type: llm
---

PASS if the response lists the outbound hosts it found with each host's call volume, gives p95 latency only for hosts and intervals that had calls, reports remote exceptions by type (or says there were none), and states that HTTP status or other non-transport errors are not visible in these metrics.
FAIL if the response invents hosts or a service name not in the data, reports latency without volume, treats a host with no data as healthy, claims HTTP status codes from the metrics, or says it changed anything.
