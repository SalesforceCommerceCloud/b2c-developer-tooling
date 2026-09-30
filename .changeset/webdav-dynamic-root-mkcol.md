---
'@salesforce/b2c-cli': patch
---

Fix `webdav put` and `webdav mkdir` failing with `403 Forbidden` for the `dynamic`, `libraries`, `catalogs`, and `securitylogs` roots; the commands no longer try to create the WebDAV root directory itself
