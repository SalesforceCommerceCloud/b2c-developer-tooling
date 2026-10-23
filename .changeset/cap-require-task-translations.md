---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

`b2c cap validate` now requires `app-configuration/translations/` when a CAP includes `tasksList.json`. Add the required Business Manager locales, and make sure `en-US.json` covers every config task key. Install runs this check unless you pass `--skip-validate`.
