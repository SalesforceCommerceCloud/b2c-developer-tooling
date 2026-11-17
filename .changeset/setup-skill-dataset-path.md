---
'@salesforce/b2c-agent-plugins': patch
---

The `b2c-setup` skill now tells agents to wait for SCAPI on a new sandbox, which can return 404 for 10 to 20 minutes after the sandbox starts, without changing the API client. Dataset imports use a `<datasets>` placeholder for a checkout at the release matching the storefront template.
