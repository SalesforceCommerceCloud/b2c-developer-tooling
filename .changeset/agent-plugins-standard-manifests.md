---
'@salesforce/b2c-agent-plugins': minor
---

Package the plugins to the open Agent Plugins standard (agent-plugins.org v1.0.0). Each plugin now has a root `plugin.json` manifest with its Codex display metadata under `extensions."com.openai"`, and the MCP server plugin ships a standard `mcp.json`. This lets Codex, Cursor, GitHub Copilot, VS Code, and Kiro consume the plugins directly; Claude Code continues to install from its marketplace as before. The legacy `.codex-plugin/plugin.json` manifests are retained during the transition so existing Codex users on older CLI versions are unaffected.
