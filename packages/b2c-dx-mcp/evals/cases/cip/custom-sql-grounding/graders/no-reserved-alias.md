---
type: regex
target: trace
match: not_contains
# A bare Calcite reserved word as an alias fails to parse (AS month, AS date, AS day, AS year).
# Requires an alias terminator (comma, FROM, escaped newline, end) so prose like "such as date ranges"
# or "as month-over-month" and CAST(x AS DATE) do not match.
pattern: '(?i)\bAS\s+(?:month|date|day|year|value)\s*(?:,|\bFROM\b|\\n|$)'
---
