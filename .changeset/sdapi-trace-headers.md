---
'@salesforce/b2c-tooling-sdk': patch
---

Script debugger (SDAPI) client now honors session cookies (e.g. `dwsid`) returned by the server, replaying them on subsequent requests. This is required for server affinity on multi-app-server instances so debugger requests reach the app server holding the session. The client also now logs full request and response headers, status, and body at trace level, matching the rest of the HTTP clients.
