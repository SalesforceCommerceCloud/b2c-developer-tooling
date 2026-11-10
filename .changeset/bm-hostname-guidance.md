---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Warn when `hostname` is a storefront Default Domain host (`*.my.commercecloud.salesforce.com`) instead of the Business Manager host. Storefront hosts sit behind eCDN rate limits and firewall rules. `b2c setup inspect`, MCP `config_inspect` and the VS Code Resolved Config panel show the warning and suggest the `.dx` host for sandboxes.
