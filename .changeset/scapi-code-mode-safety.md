---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': patch
---

SCAPI code mode is more locked down: programs can no longer open network connections themselves, and Safety Mode rules can match SCAPI operations by `operationId` or API, so you can allow-list exactly what an assistant may call.
