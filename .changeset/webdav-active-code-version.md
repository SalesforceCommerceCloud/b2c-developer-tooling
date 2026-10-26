---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
'b2c-vs-extension': minor
'@salesforce/b2c-agent-plugins': patch
---

`code deploy`, `download`, `watch`, and `list`, the MCP `cartridge_deploy` tool, and VS Code code sync now find the instance's active code version without an API client, so you can upload with just your server and no `--code-version`. Activating a code version still needs an API client.
