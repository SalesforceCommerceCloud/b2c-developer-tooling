---
'@salesforce/b2c-dx-mcp': patch
'b2c-vs-extension': patch
---

Telemetry for MCP tool failures and VS Code extension activation failures now records the underlying error message (and cause, when present), instead of an empty value. Previously these failure events carried no error detail, which made it impossible to diagnose why a tool call or activation failed. No new data beyond the error text is collected, matching what the CLI already reports for command errors.
