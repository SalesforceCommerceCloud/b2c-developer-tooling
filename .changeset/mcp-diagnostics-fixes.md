---
'@salesforce/b2c-dx-mcp': patch
---

MCP debugger waits now report a disabled script debugger instead of timing out, log polls return as soon as an error arrives, and re-arming a breakpoint no longer adds a duplicate. The SCAPI skill now notes common request pitfalls, such as which operations accept `select`.
