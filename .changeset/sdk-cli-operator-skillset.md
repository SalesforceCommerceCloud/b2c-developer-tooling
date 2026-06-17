---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

Add the `b2c-operator` skill set so it can be installed with `b2c setup skills b2c-operator` (and from the plugin marketplaces). The CLI now warns if you install a persona bundle alongside the broad plugins it is curated from, since that duplicates the same skills.
