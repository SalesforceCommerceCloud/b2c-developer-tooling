---
'@salesforce/mrt-utilities': patch
---

- The Lambda response adapter's `pipeToDestination` now destroys the destination stream when the underlying pipeline rejects, so consumers fail fast instead of hanging.
- `pipedDestinations` cleanup is unified between the success and error paths.
