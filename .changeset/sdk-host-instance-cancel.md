---
'@salesforce/b2c-tooling-sdk': minor
---

More building blocks for apps that embed the SDK. `B2CInstance` accepts its own `scapiStrategy` and `webdavStrategy`, so an app can supply the credentials SDK operations use. Site archive import, job waits, log reads and `WebDavClient` methods accept an `AbortSignal`. `WebDavClient.getTextRange()`, `normalizeWebDavPath()` and `WEBDAV_ROOTS` are available from `/clients`.
