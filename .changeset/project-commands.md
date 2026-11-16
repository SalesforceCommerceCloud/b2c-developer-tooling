---
'@salesforce/b2c-cli': minor
---

Added `b2c project` commands (preview) to inspect a project's storefront code from source, with no instance needed. `endpoints list` finds controller endpoints, filtered by ID, cartridge, or middleware. `endpoints get` shows what runs for one endpoint, in order, and which cartridge each step comes from. `hooks list` shows hook registrations in cartridge path order and flags system hooks that skip later registrations. `apis list` shows Custom API wiring, `job-steps list` shows custom job steps, and `index` exports the whole index.
