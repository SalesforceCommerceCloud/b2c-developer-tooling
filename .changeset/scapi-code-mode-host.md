---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': patch
---

Safety rules can match SCAPI code-mode requests by `operationId` or `api`, and a `readOnlySearch` rule keeps searches working ahead of a catch-all block, so a policy can allow-list SCAPI capabilities. Code-mode programs can no longer open network connections directly, and the worker refuses to run without Node's permission model. For embedding apps, the worker command is configurable, an Electron parent running as Node passes `ELECTRON_RUN_AS_NODE` to the worker, discovery hides operations the policy always blocks, and confirmations include the path template, parameters and request index. `runScapiCode`, `createScapiRequest` and `searchScapiOperations` are now stable public API.
