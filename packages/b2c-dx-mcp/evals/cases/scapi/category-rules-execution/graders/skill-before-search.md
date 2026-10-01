---
type: regex
target: trace
# Passes only if skill://mcp/scapi/SKILL.md is read (skills_read or an MCP resource read, both pass "uri")
# before the first scapi_search call. Fails when the agent skips code mode, or reads the skill only after
# the server rejects a call with SCAPI_SKILL_REQUIRED.
pattern: '^(?:(?!"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_search")[\s\S])*"uri":"skill://mcp/scapi/SKILL\.md"[\s\S]*"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_search"'
---
