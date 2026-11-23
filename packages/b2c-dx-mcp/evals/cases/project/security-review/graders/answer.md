---
type: regex
# Reports the demo client ID in OCAPI settings and the profile route that lost its CSRF check.
pattern: '^(?=[\s\S]*(?:a{30}|demo client))(?=[\s\S]*csrf)'
flags: i
---
