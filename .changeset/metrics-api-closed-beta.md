---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-agent-plugins': minor
---

Add Metrics API support (**CLOSED BETA**). The new SCAPI Observability Metrics API (`observability/metrics/v1`) is now available across the tooling:

- **SDK:** a typed `createMetricsClient` plus `getOverallMetrics`, `getSalesMetrics`, `getEcdnMetrics`, `getThirdPartyMetrics`, `getScapiMetrics`, `getScapiHooksMetrics`, `getMrtMetrics`, `getControllerMetrics`, `getOcapiMetrics`, and `getMetricsByCategory` operations that fetch operational time-series metrics for an organization. Admin OAuth scope `sfcc.metrics` is handled automatically.
- **CLI:** a new `metrics` topic — `b2c metrics list` and `b2c metrics get <category>` — with table and `--json` output.
- **MCP:** a `metrics_get` tool in the SCAPI toolset (gated as non-GA; requires `--allow-non-ga-tools`).

This is a closed beta feature: it must be enabled for your organization, and its behavior, output, and OAuth scopes may change without notice.
