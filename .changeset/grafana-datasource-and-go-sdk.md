---
'@salesforce/b2c-tooling-sdk': minor
---

Metrics tag enrichment (`parseSeriesTags`/`enrichMetricsTags`) is now driven by a declarative rule catalog exported to `specs/metrics-tags-catalog.json`, with a golden fixture (`specs/metrics-tags.golden.json`) that pins the expected tag output. This is the shared source of truth consumed by the new Go SDK and Grafana datasource, and guards against parser drift. No API changes — existing callers are unaffected.
