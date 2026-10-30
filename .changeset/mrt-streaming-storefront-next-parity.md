---
'@salesforce/mrt-utilities': patch
---

Streaming adapter fixes: responses without a body (redirects, 204s, body-less errors) no longer turn into MRT 502s; React Router 7.16+ streamed responses no longer hang when the response stream applies backpressure; and responses that already set `Content-Encoding` (for example `identity` or a pre-compressed `gzip` asset) are no longer compressed again.
