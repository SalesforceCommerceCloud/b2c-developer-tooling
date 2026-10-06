---
'@salesforce/b2c-api-schemas': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': minor
---

SCAPI code mode and `scapi_schemas_list` now see operation summaries, descriptions and examples (the bundled corpus grows to 61 APIs), so agents can search by what an operation does, not just its ID; `scapi_schemas_list` also falls back to the bundled contracts with a warning when the live Schemas API is unavailable. `scapi_search` returns a compact outline by default (nested descriptions and examples dropped to fit the 24 KB result cap); pass `detail: "full"` for all prose.
