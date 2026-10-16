---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Missing-configuration errors now say which configuration sources were loaded and suggest `b2c setup inspect`. OCAPI "isn't allowed for the current client" errors now include the Business Manager resource entry to add.
