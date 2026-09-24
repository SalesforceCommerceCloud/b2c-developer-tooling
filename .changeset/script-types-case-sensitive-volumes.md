---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Fixed cartridge IntelliSense on case-sensitive filesystems. Cross-cartridge `require()` calls (`~/cartridge/...`, `*/cartridge/...`, and named-cartridge paths) failed to resolve when the project lived on a case-sensitive volume while TypeScript itself was installed on a case-insensitive one, leaving hovers as `any` and go-to-definition doing nothing. `dw/*` types were unaffected, so the failure was easy to miss.
