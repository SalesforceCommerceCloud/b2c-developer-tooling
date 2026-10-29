---
'@salesforce/b2c-tooling-sdk': patch
---

Failed job commands now show the cause more often: they wait briefly for a log that isn't written yet, print `[DATAERROR]` lines from site import logs alongside the error, and when the log can't be downloaded, report why (for example a 401) with a `b2c webdav get --user-auth` command to read it.
