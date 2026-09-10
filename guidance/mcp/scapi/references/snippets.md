# Built-in SCAPI snippets

Generated from the shipped catalog. Discover user snippets with `codemode.search(query)`.
Describe before first use: `await codemode.describe(name)`. Run through `scapi_execute`: `await codemode.run(name, input)`.
All calls share the enclosing execution limits, configuration, and safety rules.

## builtin/create-product

Create a basic product, optionally assign it to a storefront catalog category, and verify saved fields and assignment.

Effect: write.

Input JSON Schema:

```json
{"type":"object","properties":{"productId":{"type":"string","minLength":1},"catalogId":{"type":"string","minLength":1,"description":"Owning catalog for the new product."},"name":{"type":"string","minLength":1,"description":"Product name in the default locale."},"offline":{"type":"boolean","default":true,"description":"Create offline by default; false sets the default online flag."},"category":{"type":"object","description":"Optional assignment target; its catalog may differ from the owning catalog.","properties":{"catalogId":{"type":"string","minLength":1},"categoryId":{"type":"string","minLength":1}},"required":["catalogId","categoryId"],"additionalProperties":false}},"required":["productId","catalogId"],"additionalProperties":false}
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
