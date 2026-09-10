# Built-in SCAPI snippets

Generated from the shipped catalog. Discover user snippets with `codemode.search(query)`.
Describe before first use: `await codemode.describe(name)`. Run through `scapi_execute`: `await codemode.run(name, input)`.
All calls share the enclosing execution limits, configuration, and safety rules.

## builtin/create-product

Basic product creation: select a catalog, optional name and offline state; check existence and verify saved fields.

Effect: write.

Input JSON Schema:

```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"catalogId":{"type":"string","minLength":1},"name":{"type":"string","minLength":1,"description":"Product name in the default locale."},"offline":{"type":"boolean","default":true,"description":"Create offline by default; false sets the default online flag."}},"required":["productId","catalogId"],"additionalProperties":false}
```

## builtin/campaign-promotions

Inspect campaign assignments and promotion details in bounded batches.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"campaignId":{"type":"string","minLength":1},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":12}},"required":["campaignId"],"additionalProperties":false}
```

## builtin/failed-job-triage

Search failed job executions and inspect a bounded page with continuation.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"from":{"type":"string","format":"date-time"},"to":{"type":"string","format":"date-time"},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":3}},"required":["from","to"],"additionalProperties":false}
```
