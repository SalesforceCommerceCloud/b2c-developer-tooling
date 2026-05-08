---
'b2c-vs-extension': minor
---

Add anonymous usage telemetry (extension lifecycle, command invocations, exceptions) to help prioritize fixes during the Developer Preview. Honors VS Code's `telemetry.telemetryLevel` setting and the `SFCC_DISABLE_TELEMETRY` / `SF_DISABLE_TELEMETRY` environment variables. No credentials, hostnames, or business data are collected. See the [Telemetry section in Configuration](https://salesforcecommercecloud.github.io/b2c-developer-tooling/vscode-extension/configuration#telemetry) for opt-out instructions and the full data inventory.
