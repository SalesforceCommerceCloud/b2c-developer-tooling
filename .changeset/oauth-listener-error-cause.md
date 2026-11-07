---
'@salesforce/b2c-tooling-sdk': patch
---

When the sign-in redirect listener can't start, the error now carries the socket error as `cause`, so hosts can check `cause.code === 'EADDRINUSE'` instead of matching the message.
