---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Fix AM role ID mapping between API internal/external formats and improve user display output. Role grant/revoke now correctly handle mixed formats (role IDs in roles array, enum names in roleTenantFilter). User display shows role descriptions, resolves org names, and detects auth errors with actionable --user-auth suggestions. Commands accepting org IDs now also accept friendly org names.
