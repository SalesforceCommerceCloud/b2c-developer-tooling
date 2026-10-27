---
'@salesforce/b2c-tooling-sdk': patch
---

`b2c code download` no longer fails after about five minutes on large code versions; when the server takes longer to zip the code than the connection waits, the download waits for the zip to finish and then downloads it.
