---
'b2c-vs-extension': minor
---

Add anonymous usage telemetry (extension activation/deactivation lifecycle, broad feature-category usage, exceptions) to help prioritize fixes during the Developer Preview. Sending is non-blocking. Honors the new `b2c-dx.telemetry.enabled` setting (default `true`), VS Code's `telemetry.telemetryLevel`, and the `SFCC_DISABLE_TELEMETRY` / `SF_DISABLE_TELEMETRY` environment variables. No credentials, hostnames, or business data are collected.
