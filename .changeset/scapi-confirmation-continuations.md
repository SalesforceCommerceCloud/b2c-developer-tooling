---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
---

Support per-request Safety Mode approval in SCAPI code mode through MCP elicitation, with cancellation and no server approval deadline. Approved retries resume the retained execution without replaying earlier operations; clients without form elicitation remain blocked.
