---
'@salesforce/b2c-dx-mcp': patch
---

The SCAPI skill now directs SLAS Admin tasks (tenants, SLAS clients, templates, identity providers, shopper logout and deletion) to the `b2c slas` CLI, since `scapi_execute` can't call the SLAS Admin API.
