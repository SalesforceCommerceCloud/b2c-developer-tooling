---
'@salesforce/mrt-utilities': minor
---

Add `createStreamingLambdaAdapterV2`, a new streaming Lambda adapter for MRT SSR. V2 uses a socket-intercept design that drives an unmodified Node `http.ServerResponse` instead of monkey-patching it, which improves compatibility with Express 4 and 5. It supports br/gzip/deflate response compression with `Accept-Encoding` negotiation, configurable via the new `StreamingCompressionConfig` type. The existing `createStreamingLambdaAdapter` (V1) remains the default.
