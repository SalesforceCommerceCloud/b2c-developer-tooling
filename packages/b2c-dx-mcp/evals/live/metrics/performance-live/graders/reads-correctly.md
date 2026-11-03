---
type: llm
---

PASS if the response compares the last hour with the same hour the previous day (two equal-length windows), reports latency together with request volume, and either localizes a change to a layer (API family, hooks, cache, outbound host) with the supporting numbers or says no meaningful change was found.
FAIL if the response compares windows of different lengths, treats missing latency points as zero or as fast, names a root cause without metric evidence, reports a series id with a realm or environment prefix as an API family, or says it changed anything.
