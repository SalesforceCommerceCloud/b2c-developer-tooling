---
id: replication
title: Data Replication
category: deployment
tags: [replication, staging, production, deployment]
---

Replication moves data from staging to production in a controlled,
auditable way. It is the standard pattern for promoting catalogs, content,
prices, inventory, custom attributes, and most metadata.

## Where to manage

`Merchant Tools > Site Development > Site Data Replication`

## Replication types

- **Site data replication** — site-scoped data (catalogs assignment, prices,
  promotions, content slots).
- **Organization-level data replication** — shared data (system object
  definitions, jobs, services, global preferences).

## Typical flow

1. Stage the change on the staging instance.
2. Create a replication group containing the affected data types.
3. Run the replication group manually, or schedule it for a release window.
4. Production picks up the changes once the data is replicated **and** the
   accompanying code version is activated.

## Tips

- **Code and data go together** — a feature that needs new custom attributes
  ships in two parts: code (via WebDAV/code activation) and data (via
  replication). Coordinate both in the same release.
- The `Last Successful Replication` timestamp is the audit trail — capture it
  in your release notes.
- Inventory and pricing have dedicated replication groups because of their
  high churn — replicate them on a faster cadence than the rest of the
  catalog.
