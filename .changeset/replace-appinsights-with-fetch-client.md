---
'@salesforce/b2c-tooling-sdk': patch
'b2c-vs-extension': patch
---

Replace the `applicationinsights` dependency with a tiny built-in telemetry client that posts directly to the Application Insights ingestion endpoint using Node's native `fetch`. This removes ~270 transitive packages (the OpenTelemetry, Azure SDK, and gRPC trees that the v3 SDK pulled in for auto-collection features we never used) and shrinks the published packages and the VS Code extension bundle. Telemetry behavior is unchanged — the same events and exceptions are reported — and the machine-identifying cloud role instance is now correctly suppressed for GDPR. A new optional `flushIntervalMs` option enables periodic delivery for long-lived hosts; the VS Code extension uses it so a session's usage events are not lost on a non-clean shutdown. No public SDK API change.
