---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add support for the SCAPI Preferences API. The SDK exposes `createPreferencesClient` and the CLI exposes a new `b2c scapi preferences` topic with `global list/get/update`, `site list/get/update/search`, and `site preference get/update` commands. Read scope is `sfcc.preferences`; write scope is `sfcc.preferences.rw`.
