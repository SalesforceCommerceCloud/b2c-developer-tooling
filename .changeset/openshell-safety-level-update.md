---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

`b2c setup openshell` now applies a changed safety level to the sandbox's network policy on re-run, instead of treating the generated policy as edited, and warns when a setting such as the CLI's safety level needs `--recreate` to take effect.
