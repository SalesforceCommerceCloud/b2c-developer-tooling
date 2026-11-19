---
'@salesforce/b2c-dx-mcp': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-agent-plugins': patch
'b2c-vs-extension': patch
---

Routes, overlays, and hooks now follow the site's cartridge path only: cartridges in the project that aren't on the path are listed as not on the path and left out, and security findings in them are marked. `project_inspect` and `security_scan` also read the site's cartridge path live from the instance when SCAPI is configured, take a `siteId` input, and report where the order came from (`cartridgePathSource`). To see every cartridge as before, use `--all-cartridges` in the CLI, `allCartridges` in the MCP tools, or **Include Cartridges Not on the Path** in VS Code, where cartridges off the path are now dimmed.
