---
'@salesforce/b2c-cli': minor
---

Add `ecdn firewall` commands (`list`, `get`, `create`, `update`, `delete`,
`reorder`) for managing custom firewall rules on a CDN zone via the existing
cdn-zones v1 APIs (`/firewall-custom/rules`). Supports partial updates,
`--json` output (with table column flags on `list`), and routes destructive
operations (`delete`, `reorder`) through the same safety guard the rest of
the CLI uses.
