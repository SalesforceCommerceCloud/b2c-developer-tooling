---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': minor
---

Add Metrics API support (**CLOSED BETA**). The new SCAPI Observability Metrics API (`observability/metrics/v1`) is now available across the tooling:

- **SDK:** a typed `createMetricsClient` plus `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, and `getMetricsByCategory` operations that fetch operational time-series metrics for an organization. Admin OAuth scope `sfcc.metrics` is handled automatically. Time bounds accept a `Date` or epoch milliseconds and are sent to the API as epoch seconds; response timestamps are normalized to epoch milliseconds.
- **CLI:** a new `metrics` topic — `b2c metrics list` and `b2c metrics get <category>` — with table and `--json` output. The time window is set with `--from`/`--to` (relative like `1h`/`7d` or ISO 8601) and an optional `--window` duration (e.g. `--from 7d --window 1h` for a one-hour window seven days ago). Any open bound defaults to a 24-hour window (the API caps a window at 24 hours), so requests always send an explicit range.
- **MCP:** a `metrics_get` tool in the SCAPI toolset (gated as non-GA; requires `--allow-non-ga-tools`).

This is a closed beta feature: it must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.
