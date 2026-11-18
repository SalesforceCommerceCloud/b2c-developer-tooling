---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-cli': patch
---

SCAPI code mode now runs programs in an in-process QuickJS sandbox instead of a Node child process, with no network, file system or timer access. Programs read contracts through async `spec` calls (`await spec.operations()`, `await spec.operation(path, method)`) in place of `spec.paths`, and wait with `await sleep(ms)`. Approved `scapi_execute` writes now resume by replaying the earlier answers, so earlier requests are never sent twice. SDK users can wrap every call with `interceptors` and pause or resume a run with its `journal`. Node.js 22.19 or later is now required.
