---
type: regex
target: trace
# Inspection only: no write requests to the zone APIs.
pattern: 'method\\?["'']?\s*:\s*\\?["''](?:POST|PUT|PATCH|DELETE)'
match: not_contains
---
