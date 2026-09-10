---
'@salesforce/b2c-tooling-sdk': minor
---

MRT commands are now aware of Managed Runtime maintenance (read-only) mode. Read commands (list, get) print a non-blocking warning but still run, while write commands (deploys, bundle uploads, environment changes) are blocked with a clear, actionable error instead of a raw API response — both pointing to the Managed Runtime Admin status page for current status and ETA.
