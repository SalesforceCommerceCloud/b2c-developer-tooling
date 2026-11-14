---
'b2c-vs-extension': minor
---

The Cartridges view now orders cartridges by your instance's site cartridge path when no `cartridges` configuration is set, and you can reorder it with drag and drop or Move Up/Down (saved per workspace). The view shows where its order comes from. Go-to-definition for `*/cartridge/...` requires now follows this order from left to right, as the platform does, instead of preferring the calling file's own cartridge.
