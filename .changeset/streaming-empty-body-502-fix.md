---
'@salesforce/mrt-utilities': patch
---

Fix body-less streaming responses returning a 502 at the MRT edge. Redirects, 204/304, `HEAD`, and bare `res.end()` responses now emit an empty write before ending the stream, forcing the AWS runtime to send its status/headers metadata prelude. Without this, the streaming edge could not frame the response and returned its own 502 regardless of the intended status code. Both `createStreamingLambdaAdapter` (V1) and `createStreamingLambdaAdapterV2` handle this correctly.
