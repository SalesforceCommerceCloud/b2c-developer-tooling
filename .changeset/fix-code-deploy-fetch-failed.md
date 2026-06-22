---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Network errors during `b2c code deploy` and other WebDAV operations are now classified (timeout, connection reset, DNS, TLS, etc.) with actionable error messages including the operation, host, and remediation hints — no more bare "fetch failed". The server-side unzip step now has an explicit timeout, and if the connection drops it reports a clear error noting the server may still be extracting the archive (so it is not silently re-run, which could corrupt the code version) and leaves the uploaded archive in place for verification.
