---
'@salesforce/b2c-agent-plugins': patch
'@salesforce/b2c-dx-docs': patch
---

The `b2c-setup` skill and the Realm Setup guide now explain that a new sandbox's SCAPI can return 404 for 10 to 20 minutes after it starts, and how to wait for it without changing the API client. The skill's dataset imports use a `<datasets>` placeholder for a checkout at the release matching the storefront template.
