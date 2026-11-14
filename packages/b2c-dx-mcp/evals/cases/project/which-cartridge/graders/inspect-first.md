---
type: regex
target: trace
# project_inspect is called before any Read, Grep, Glob, or Bash call.
pattern: '^(?:(?!"name":"(?:Read|Grep|Glob|Bash)")[\s\S])*"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__project_inspect"'
---
