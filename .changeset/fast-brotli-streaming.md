---
'@salesforce/mrt-utilities': patch
---

Improve streamed response performance by using a runtime-appropriate Brotli quality and periodically flushing compressed output. The Brotli quality and flush threshold can now be tuned via the `MRT_BROTLI_COMPRESSION_QUALITY` (0-11) and `MRT_BROTLI_FLUSH_THRESHOLD_BYTES` (bytes) environment variables, and the periodic flushing behavior can be disabled by setting `MRT_BROTLI_CHUNKING_ENABLED=false`.
