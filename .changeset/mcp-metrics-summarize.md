---
'@salesforce/b2c-dx-mcp': minor
---

`metrics_get` accepts `summarize: true` to return per-series statistics instead of every data point, so agents can scan whole categories without exceeding output limits. Output is now compact JSON.
