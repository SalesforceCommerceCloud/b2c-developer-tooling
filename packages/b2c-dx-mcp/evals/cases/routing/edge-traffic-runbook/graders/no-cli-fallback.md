---
type: regex
target: trace
# No shell fallback to the b2c CLI or raw HTTP for a task code mode covers.
pattern: '"command":"[^"]*(?:\bb2c\b|curl |npx @salesforce/b2c-cli)'
match: not_contains
---
