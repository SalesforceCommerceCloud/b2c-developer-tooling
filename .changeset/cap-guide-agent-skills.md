---
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Refocus the Commerce Apps (CAP) documentation on the B2C CLI workflow and recommend the `b2c-cli`, `b2c`, and `cap-dev` agent skills plugins (the latter from the `SalesforceCommerceCloud/commerce-apps` marketplace). The guide now links to the official Commerce Apps ISV Developer Guide as the authoritative spec rather than duplicating it, and corrects several details against canon and the CLI source: the tax extension point is `sfcc.app.tax.calculate`, the install upload path is `Impex/commerce-apps/`, the lifecycle states are `INSTALLING → INSTALLED → NOT_CONFIGURED → CONFIGURING → CONFIGURED`, and `cap package` produces `{id}-v{version}.zip`. The `b2c-cap` skill and CAP CLI reference gain WebDAV auth, icon-naming, and registry-vs-local-validation clarifications.
