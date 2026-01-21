---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Fix HTML response bodies appearing in ERROR log lines. When API requests fail with non-JSON responses (like HTML error pages), error messages now show the HTTP status code (e.g., "HTTP 521 Web Server Is Down") instead of serializing the entire response body.

Added `getApiErrorMessage(error, response)` utility that extracts clean error messages from ODS, OCAPI, and SCAPI error patterns with HTTP status fallback.
