---
type: regex
target: trace
match: not_contains
# ccdw_aggr_sales_summary has num_orders and num_units; SUM(orders) or SUM(units) is a guessed column.
pattern: '(?i)SUM\(\s*(?:\w+\.)?(?:orders|units)\s*\)'
---
