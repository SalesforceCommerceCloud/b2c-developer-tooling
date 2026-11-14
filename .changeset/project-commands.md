---
'@salesforce/b2c-cli': minor
---

Added `b2c project endpoints`, `endpoint`, `hooks`, `apis`, and `index` to inspect a project's storefront code from source: controller endpoints composed across the cartridge path with the middleware that runs for each, hook registrations in cartridge path order (flagging system hooks that return a value and skip later registrations), and Custom API wiring.
