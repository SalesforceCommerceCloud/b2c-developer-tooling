---
'@salesforce/b2c-cli': patch
---

`b2c setup instance create` now prints the dw.json path it wrote and explains how to use the instance from other directories (`--config`, `--project-directory`, or `setup default-config set`). When the name already exists, the error now points to `b2c setup set ... --instance <name>` instead of only asking for a different name.
