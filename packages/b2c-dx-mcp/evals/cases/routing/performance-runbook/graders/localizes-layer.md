---
type: llm
---

PASS if the response uses or plans to use SCAPI latency by API family (against the overall rollup or a comparison window) to localize the slowdown, and checks at least two of: hook execution time, cache hit share, third-party (outbound) latency.
FAIL if the response names a root cause without metrics evidence, treats missing latency points as zero or as fast, or says it changed code, cache or configuration.
