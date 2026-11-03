---
type: regex
target: trace
# If the agent calls scapi_search, skill://mcp/b2c-mcp-scapi/SKILL.md must be read before the first call.
# Answering without searching is valid here (the answer graders judge its content), so no search also passes.
pattern: '^(?![\s\S]*"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_search")|^(?:(?!"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_search")[\s\S])*"uri":"skill://mcp/b2c-mcp-scapi/SKILL\.md"[\s\S]*"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_search"'
---
