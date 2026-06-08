---
'b2c-vs-extension': patch
'@salesforce/b2c-tooling-sdk': patch
---

Make the VS Code extension resilient offline and when an instance is unreachable. A malformed `dw.json` no longer prevents the extension from activating, so local code browsing — cartridge discovery, Script API IntelliSense, cartridge-path require resolution, CAP detection, and scaffolding — keeps working without a connection. Connection-dependent views (WebDAV, Content, Sandbox, Logs) now collapse repeated "instance unreachable" errors into a single notification instead of flooding, and the Sandbox view explains when Account Manager OAuth credentials are the missing piece. The SDK's `listInstances()` now tolerates a malformed `dw.json` (returning no instances) rather than throwing.
