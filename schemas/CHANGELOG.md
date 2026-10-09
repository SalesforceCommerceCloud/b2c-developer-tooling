# @salesforce/b2c-api-schemas

## 0.3.0

### Minor Changes

- [#741](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/741) [`c45c5fa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c45c5fac903c5bf77eecfc4a4befd259712aa84e) - SCAPI code mode and `scapi_schemas_list` now see operation summaries, descriptions and examples (the bundled corpus grows to 61 APIs), so agents can search by what an operation does, not just its ID; `scapi_schemas_list` also falls back to the bundled contracts with a warning when the live Schemas API is unavailable. `scapi_search` returns a compact outline by default (nested descriptions and examples dropped to fit the 24 KB result cap); pass `detail: "full"` for all prose. (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.0

### Minor Changes

- [#670](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/670) [`407075c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/407075c8d6b69647afbc31ac15004941be84957a) - Add SCAPI code mode with offline discovery of 594 Admin and Shopper operations and standard or custom Admin API execution using automatic authentication and SDK Safety Mode. Compose requests and return focused results through `scapi_search` and `scapi_execute`, with bounded execution and actionable access errors. (Thanks [@clavery](https://github.com/clavery)!)

  Discover tenant custom API contracts live and execute their declared Admin operations. Live schema reads include custom-property definitions by default; known custom fields work directly in standard Admin requests. Bundled schemas remain tenant-independent.

  Reuse built-in workflows for product creation with optional category assignment, campaign/promotion inspection, and failed-job triage, or save reviewed workflows for later use. Export Account Manager and SLAS tokens when an external client needs them; normal SCAPI requests authenticate automatically. Code mode restricts local filesystem/process APIs to keep programs focused on API workflows; use terminal and file tools for local development.
