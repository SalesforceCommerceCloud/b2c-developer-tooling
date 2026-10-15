---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-agent-plugins': patch
---

Fix `b2c ecdn zones list` and `--zone <name>` lookup only seeing the first 25 zones; zones are now paged in full. The SDK adds a `listAllZones` helper.
