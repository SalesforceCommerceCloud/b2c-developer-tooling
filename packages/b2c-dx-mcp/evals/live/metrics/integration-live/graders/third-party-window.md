---
type: regex
target: trace
# third-party is queried with an explicit bounded window (window/to, or from of an hour or less), not the 24 h default.
pattern: '"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__metrics_get","input":\{[^}]*"category":"third-party"[^}]*(?:"(?:window|to)":|"from":"(?:\d+m|1h)")'
---
