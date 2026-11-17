---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': patch
---

Added the `project_inspect` and `security_scan` tools to the `CARTRIDGES` and `STOREFRONTNEXT` toolsets. `project_inspect` (preview) lists controller endpoints, filtered by ID, cartridge, or middleware, and shows what runs for one across the cartridge path. It also covers hooks in cartridge path order, Custom API wiring, and custom job steps. It loads at session start so assistants check it before reading controller files; `security_scan` finds security problems in cartridge code and site data (preview). Both work offline from the project directory.
