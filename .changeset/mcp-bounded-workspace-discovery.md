---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-mcp': minor
---

Fix costly recursive filesystem scan on MCP server startup. Workspace auto-discovery previously did an unbounded `**/.project` walk from the launch directory, which could hang startup when the server was spawned from a home directory (as Cursor and Claude Code often do). Discovery is now skipped entirely when explicit `--toolsets`/`--tools` are provided, skipped for home and root directories, and otherwise depth-bounded and short-circuited at the first match. `findCartridges` gains optional `maxDepth` and `firstMatchOnly` options for callers that need a bounded search (existing callers are unaffected).
