---
'@salesforce/b2c-cli': patch
---

`b2c ecdn firewall list` and `b2c ecdn rate-limit list` now report no rules instead of failing with `Not Found` when a zone has no rules.
