---
'@salesforce/b2c-agent-plugins': patch
---

Clarify SCAPI Admin OAuth scopes in the custom API and Account Manager skills. The custom-api-development, scapi-admin, scapi-custom, and config skills now consistently document that Admin API tokens (system and custom) require both the tenant scope `SALESFORCE_COMMERCE_API:<tenant_id>` and the API-specific scopes, that `b2c auth token` accepts multiple `--auth-scope` values, and that — unlike the SCAPI subcommands — `b2c auth token` does not auto-inject the tenant scope. Also fixes a broken admin token curl example and an invalid `--scope` flag reference in the testing docs.
