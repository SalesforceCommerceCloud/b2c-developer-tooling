---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Refresh the MRT admin API schema and add new commands:

- `b2c mrt env clone` — clone an environment from an existing source, optionally copying redirects, environment variables, and B2C target info
- `b2c mrt bundle delete` — delete one or more bundles (uses bulk-delete when more than one ID is supplied)
- `b2c mrt org member list|add|get|update|remove` — manage organization-level members
- `b2c mrt org cert list|get|create|delete|restart-validation` — manage custom domain certificates referenced by environments
