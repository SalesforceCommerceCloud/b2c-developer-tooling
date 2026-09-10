---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-api-schemas': minor
'@salesforce/b2c-agent-plugins': patch
'@salesforce/b2c-dx-docs': patch
---

Add SCAPI code mode with offline discovery of 594 Admin and Shopper operations and standard or custom Admin API execution using automatic authentication and SDK Safety Mode. Compose requests and return focused results through `scapi_search` and `scapi_execute`, with bounded execution and actionable access errors.

Discover tenant custom API contracts live and execute their declared Admin operations. Live schema reads include custom-property definitions by default; known custom fields work directly in standard Admin requests. Bundled schemas remain tenant-independent.

Reuse built-in workflows for product creation with optional category assignment, campaign/promotion inspection, and failed-job triage, or save reviewed workflows for later use. Export Account Manager and SLAS tokens when an external client needs them; normal SCAPI requests authenticate automatically. Code mode restricts local filesystem/process APIs to keep programs focused on API workflows; use terminal and file tools for local development.
