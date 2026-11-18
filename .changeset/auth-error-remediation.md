---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': minor
---

Rejected scopes, refused API client credentials, missing OCAPI permissions, and WebDAV 401/403/404 errors now say what to change and link the docs section that explains it. In MCP tool errors, the hint names the `docs_read` call to make, and `docs_read` accepts a `section` input to read one heading of a page.
