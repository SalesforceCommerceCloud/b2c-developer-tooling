---
'@salesforce/b2c-tooling-sdk': patch
---

Network failures from API commands (such as MRT, OCAPI and SCAPI) now say which request and host failed and why (for example a TLS, DNS or timeout problem) instead of a bare "fetch failed".
