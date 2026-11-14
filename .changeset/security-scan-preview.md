---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Added `b2c security scan`, `b2c security rules`, and `b2c security baseline` (preview) to find security problems in cartridge code: object query injection, open redirects, file paths and upload names chosen by the client, weak cryptography, hardcoded credentials, insecure cookies, and dynamic code. Scans run locally with no instance or credentials, support inline suppressions and baselines, and can write SARIF for GitHub code scanning. The SDK exposes the scanner as `@salesforce/b2c-tooling-sdk/security`.
