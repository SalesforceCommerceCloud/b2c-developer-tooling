---
'b2c-vs-extension': patch
---

Fix Content Libraries tree not updating when switching instances. The tree previously kept libraries from the old instance; it now re-seeds from the newly active instance's configured `contentLibrary` on switch.
