---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': patch
---

Added the `project_inspect` and `security_scan` tools to the `CARTRIDGES` and `STOREFRONTNEXT` toolsets. `project_inspect` shows controller endpoints and what runs for each across the cartridge path, hooks in cartridge path order, and Custom API wiring, and loads at session start so assistants check it before reading controller files; `security_scan` finds security problems in cartridge code and site data (preview). Both work offline from the project directory.
