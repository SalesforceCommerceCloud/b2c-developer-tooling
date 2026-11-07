---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Add a `b2c:log-redaction` plugin hook and `globalLogRedactorRegistry` so plugins and apps that embed the SDK can remove more from log output, such as secrets nested deeply or tokens inside messages. `redactLogValue()` and `deepLogRedactor` provide ready-made rules. Logs are unchanged unless a redactor is registered.
