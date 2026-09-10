---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-dx-docs': patch
---

Export Account Manager and SLAS tokens through code mode for external clients. Normal SCAPI requests still authenticate automatically; direct fetch and WebSocket calls inside code-mode programs now direct you to the managed SCAPI helper.

Keep code mode focused on API workflows by restricting filesystem APIs, subprocesses, worker threads, and native addons. Use terminal or file tools for local development work.
