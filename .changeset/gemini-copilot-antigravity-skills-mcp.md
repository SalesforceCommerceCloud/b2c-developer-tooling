---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': patch
'@salesforce/b2c-agent-plugins': patch
'@salesforce/b2c-dx-docs': patch
---

Add first-class support for installing B2C agent skills and the `b2c-dx-mcp` MCP server in Gemini and Google Antigravity. `b2c setup skills` now accepts `--ide gemini-cli` (writes to `.gemini/skills`) and `--ide antigravity` (writes to `.agents/skills`), a Gemini CLI extension bundles the MCP server plus project context (`gemini extensions install <repo>`), and the docs cover Gemini CLI, Gemini Code Assist, and Antigravity (IDE/CLI/SDK), including which surfaces are not supported (the consumer Gemini and Microsoft Copilot desktop apps). Scope note: Antigravity support was folded into this work alongside Gemini and GitHub Copilot.

The VS Code extension's "Set Up Agent Skills & MCP" walkthrough now includes a dedicated **GitHub Copilot CLI** card (installs skills via the marketplace-plugin command, with a proper uninstall-then-install "Reinstall"), detects and displays per-tool **MCP server** status alongside skills status, and clarifies the summary counts (tools supported · detected here · with skills · with MCP). The MCP action reads "Re-configure MCP" once a server is registered. The "Install the B2C CLI" step now shows the detected `b2c-cli` version and disables "Update CLI" when the CLI is already up to date.
