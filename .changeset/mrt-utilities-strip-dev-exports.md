---
'@salesforce/mrt-utilities': patch
---

Fix package export resolution for consumers by stripping `development` export conditions during `prepack`, so published tarballs always resolve to shipped `dist` files.
