---
type: regex
target: trace
# Inspection only: no deploys, uploads or write requests.
pattern: '"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__(?:cartridge_deploy|webdav_put|mrt_bundle_push)"|method\\?["'']?\s*:\s*\\?["''](?:POST|PUT|PATCH|DELETE)'
match: not_contains
---
