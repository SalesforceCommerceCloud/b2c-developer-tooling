---
type: regex
# Reported names come from series tags, not packed ids such as `<realm>_<env>.product` or `<realm>_<env> 4xx`.
pattern: '\b[a-z0-9]+_(?:prd|stg|dev|s\d{2})(?:\.[A-Za-z]|\s(?:[1-5]xx|Average|Shop))'
match: not_contains
---
