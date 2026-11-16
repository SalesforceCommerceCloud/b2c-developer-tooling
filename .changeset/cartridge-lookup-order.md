---
'b2c-vs-extension': patch
---

Go-to-definition for `*/cartridge/...` requires now searches the cartridge path from left to right, as the platform does. Before, it checked the calling file's own cartridge first and could open the wrong file.
