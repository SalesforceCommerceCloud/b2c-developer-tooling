---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'b2c-vs-extension': minor
'@salesforce/b2c-agent-plugins': patch
---

WebDAV commands (`webdav`, `logs`, and `code deploy`/`download`/`watch`), the MCP WebDAV, logs, and cartridge tools, and VS Code code sync now work with only a server configured: you sign in to Account Manager in a browser and your Business Manager role authorizes access. MCP clients that support URL elicitation show the sign-in link instead of the server opening a browser. A refused request names the user and the functional permission they need.
