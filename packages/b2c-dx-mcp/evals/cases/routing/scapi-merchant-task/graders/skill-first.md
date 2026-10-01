---
type: regex
target: trace
# skill://mcp/scapi/SKILL.md is read before the first scapi_search or scapi_execute call.
pattern: '^(?:(?!"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_(?:search|execute)")[\s\S])*"uri":"skill://mcp/scapi/SKILL\.md"[\s\S]*"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__scapi_(?:search|execute)"'
---
