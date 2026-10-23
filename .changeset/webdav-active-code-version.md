---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'b2c-vs-extension': minor
'@salesforce/b2c-agent-plugins': patch
---

Find the active code version without an API client: `code deploy`, `download`, `watch`, and `list`, the MCP `cartridge_deploy` tool, and VS Code code sync now read it from the instance over WebDAV, so a server and a browser login are enough to upload to the active version. Activating a code version still needs an API client.
