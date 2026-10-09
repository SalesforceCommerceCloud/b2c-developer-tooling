---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API IntelliSense no longer re-reads every project file path on each hover, completion and diagnostics request, which added a few milliseconds to every request in large cartridge workspaces.
