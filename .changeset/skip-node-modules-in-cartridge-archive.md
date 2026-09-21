---
'@salesforce/b2c-tooling-sdk': patch
---

Cartridge deploy no longer archives `node_modules`, `.git`, and other build/dependency directories found inside a cartridge, preventing multi-minute or stuck uploads when a `.project` file sits at a project root.
