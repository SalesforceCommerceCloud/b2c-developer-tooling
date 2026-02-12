---
'@salesforce/b2c-tooling-sdk': minor
---

Accept both camelCase and kebab-case for all field names in dw.json and package.json `b2c` config. For example, `clientId` and `client-id` are now equivalent everywhere. Legacy aliases like `server`, `passphrase`, and `selfsigned` continue to work.
