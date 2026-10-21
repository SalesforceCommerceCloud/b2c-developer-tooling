---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Help for WebDAV-backed commands (`logs`, `webdav`, `code deploy/watch/download`) now explains which credentials apply, that Basic auth wins when both are configured, and how to switch to the API client. `--password` and the `setup instance create` prompt now consistently ask for a WebDAV access key (not the Account Manager password) and say how to create one.
