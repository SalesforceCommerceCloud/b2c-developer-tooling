---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

`scapi_execute` can now call Shopper APIs as a guest shopper using your SLAS client, so any Storefront Next project works out of the box. The guest session persists across executions, so baskets carry over. Registered-shopper-only operations are not yet supported.
