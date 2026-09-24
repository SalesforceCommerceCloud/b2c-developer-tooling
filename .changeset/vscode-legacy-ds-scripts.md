---
'b2c-vs-extension': minor
---

Treat legacy `.ds` cartridge scripts like their `.js` siblings. Files under `cartridge/scripts/` now open in JavaScript mode — syntax highlighting, completions, hover docs for `dw/*`, and debugger breakpoints — and `require()` calls, hook references, and job step modules resolve to `.ds` files (`.js` still wins when both exist). Set `files.associations` in your own settings to opt out if you use `.ds` files for something else.
