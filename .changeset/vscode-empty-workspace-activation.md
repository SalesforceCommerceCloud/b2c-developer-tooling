---
'b2c-vs-extension': patch
---

Stop the VS Code extension from blocking other extensions in empty or non-B2C windows. Because the extension registers a TypeScript server plugin, VS Code activates it whenever any JavaScript/TypeScript file is opened — including windows with no folder. In that case the extension no longer falls back to the process working directory, and all cartridge/workspace discovery now runs only from a concrete workspace folder and never from a home or filesystem-root directory, so it can't trigger a recursive filesystem scan that stalls the extension host.
