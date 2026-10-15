---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Commands now use your configured `siteId`, `realm` and `mrtProject` when the matching flag is omitted (`sites cartridges`, `preferences site`, `cap install/tasks/uninstall`, `sandbox create`, `mrt bundle save`).
