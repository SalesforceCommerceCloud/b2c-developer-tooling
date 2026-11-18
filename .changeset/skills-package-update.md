---
'@salesforce/b2c-tooling-sdk': patch
---

Skill reads no longer fail with "Packaged skills are inconsistent" after the MCP package is updated while the server is running; the server reloads the installed skills, and asks for a restart only if that fails.
