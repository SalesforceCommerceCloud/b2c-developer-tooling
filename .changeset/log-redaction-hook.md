---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Plugins can redact more from CLI log output, such as deeply nested secrets or tokens inside messages, with the new `b2c:log-redaction` hook. Logs are unchanged unless a plugin uses it.
