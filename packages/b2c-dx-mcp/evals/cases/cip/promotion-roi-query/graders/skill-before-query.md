---
type: regex
target: trace
# Passes if skill://mcp/b2c-mcp-cip/SKILL.md is read (skills_read or an MCP resource read, both pass "uri")
# before the first cip_query call, or if cip_query is never called. With no instance configured,
# stopping after config_inspect is a reasonable answer; this case only grades the ordering.
pattern: '^(?:(?!"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__cip_query")[\s\S])*(?:"uri":"skill://mcp/b2c-mcp-cip/SKILL\.md"|$)'
---
