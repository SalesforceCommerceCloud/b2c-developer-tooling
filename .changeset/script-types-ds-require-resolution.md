---
'@salesforce/b2c-cli': patch
---

Script API IntelliSense now resolves cartridge requires that point at legacy `.ds` scripts, and reports them to the language service as JavaScript rather than TypeScript. `.js` still takes precedence when both extensions exist.
