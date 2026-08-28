---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Allow SLAS client `get`, `update`, `delete`, and `open` commands to use the configured SLAS client ID when their positional client ID is omitted, while keeping the positional value as an explicit override.
