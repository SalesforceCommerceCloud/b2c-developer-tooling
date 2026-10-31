---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API IntelliSense fixes: `this` in SFRA middleware is now typed as the route, requests are faster in large cartridge workspaces, and the tsserver plugin no longer resolves `require()` paths outside the bundled types and cartridge roots of a malicious repository.
