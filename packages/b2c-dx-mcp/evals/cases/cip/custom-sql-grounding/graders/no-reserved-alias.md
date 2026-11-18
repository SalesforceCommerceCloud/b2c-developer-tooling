---
type: regex
target: trace
match: not_contains
# A bare Calcite reserved word as an alias fails to parse (AS month, AS date, AS day, AS year).
pattern: '(?i)\bAS\s+(?:month|date|day|year|value)\b(?!\s*[()"])'
---
