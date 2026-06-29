---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Document the standard (system) job steps that B2C Commerce ships for Business Manager job flows. The bundled docs corpus now includes the full catalog of standard job step type IDs (e.g. `ImportCatalog`, `ExportCatalog`, `ExecutePreconfiguredDataReplicationProcess`, `SearchReindex`) with each step's purpose, scope, and configuration parameters — sourced from the public B2C Commerce Job Step API documentation and searchable through `b2c docs search`/`b2c docs read` (and the `docs_search`/`docs_read` MCP tools) with no new commands. Read the catalog with `b2c docs read job-steps` or a specific step with `b2c docs read <TypeID>`. The job and custom-job-step skills now cover referencing an IMPEX-staged file from a prior step, chaining custom and standard steps in one flow, and choosing an in-flow system step vs. the CLI equivalent (e.g. a standard catalog import vs. `b2c job import`).
