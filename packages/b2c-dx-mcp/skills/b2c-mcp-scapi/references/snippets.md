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

## builtin/job-execution-review

Review job executions in a fixed interval, including successful runs; return compact statuses and continuation.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"from":{"type":"string","format":"date-time"},"to":{"type":"string","format":"date-time"},"jobId":{"type":"string","minLength":1},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":20}},"required":["from","to"],"additionalProperties":false}
```

## builtin/job-execution-inspect

Inspect one execution and a bounded page of its steps; return the exact WebDAV log path.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"jobId":{"type":"string","minLength":1},"executionId":{"type":"string","minLength":1},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":20}},"required":["jobId","executionId"],"additionalProperties":false}
```

## builtin/code-version-inspect

Identify active and rollback code versions and inspect a bounded page of version metadata.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":20}},"required":[],"additionalProperties":false}
```

## builtin/site-cartridge-inspect

Inspect site status, catalog, and ordered cartridge paths; check expected cartridge names.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"siteId":{"type":"string","minLength":1},"expectedCartridges":{"type":"array","maxItems":50,"items":{"type":"string","minLength":1}}},"required":["siteId"],"additionalProperties":false}
```

## builtin/object-type-attributes-inspect

List attribute definitions of a system object type (Product, Order, Profile, ...) as compact rows with value types and enum values; filter by custom/system, IDs, or text.

Effect: read.

Input JSON Schema:

```json
{"type":"object","properties":{"objectType":{"type":"string","minLength":1,"description":"System object type, for example Product."},"custom":{"type":"boolean","description":"true for custom attributes only, false for system attributes only."},"ids":{"type":"array","maxItems":50,"items":{"type":"string","minLength":1},"description":"Attribute IDs, with or without the c_ prefix."},"text":{"type":"string","minLength":1,"description":"Match text in the attribute ID or display name."},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":100}},"required":["objectType"],"additionalProperties":false}
```

## builtin/attribute-create-and-group

Create a custom attribute definition on a system object type if it does not exist, optionally create or reuse an attribute group and assign it, then verify.

Effect: write.

Input JSON Schema:

```json
{"type":"object","properties":{"objectType":{"type":"string","minLength":1},"attributeId":{"type":"string","minLength":1,"description":"Attribute ID, with or without the c_ prefix."},"valueType":{"type":"string","enum":["string","int","double","text","html","date","image","boolean","money","quantity","datetime","email","password","set_of_string","set_of_int","set_of_double","enum_of_string","enum_of_int"]},"displayName":{"type":"string","minLength":1,"description":"Display name in the default locale."},"properties":{"type":"object","description":"Extra ObjectAttributeDefinition fields, for example {\"localizable\": true, \"siteSpecific\": true}. valueDefinitions is ignored by the API."},"groupId":{"type":"string","minLength":1,"description":"Attribute group to assign the attribute to; created if missing."},"groupDisplayName":{"type":"string","minLength":1}},"required":["objectType","attributeId","valueType"],"additionalProperties":false}
```

## builtin/cors-preferences-update

Add or remove one client's CORS origins for a site without replacing other clients, and verify the saved origins.

Effect: write.

Input JSON Schema:

```json
{"type":"object","properties":{"siteId":{"type":"string","minLength":1},"clientId":{"type":"string","minLength":1,"description":"Shopper (SLAS) client ID."},"add":{"type":"array","maxItems":50,"items":{"type":"string","minLength":1,"description":"Origin such as https://www.example.com"}},"remove":{"type":"array","maxItems":50,"items":{"type":"string","minLength":1}}},"required":["siteId","clientId"],"additionalProperties":false}
```

## builtin/category-rules-run

Evaluate (dry run) or execute a category's dynamic categorization rules, poll status, and return counts with continuation.

Effect: write.

Input JSON Schema:

```json
{"type":"object","properties":{"catalogId":{"type":"string","minLength":1},"categoryId":{"type":"string","minLength":1},"execute":{"type":"boolean","default":false,"description":"false evaluates matches only; true assigns and unassigns products."},"statusOnly":{"type":"boolean","default":false,"description":"Poll the latest run without starting one."},"polls":{"type":"integer","minimum":1,"maximum":15,"default":6},"limit":{"type":"integer","minimum":1,"maximum":50,"description":"Evaluation productIds page size."},"offset":{"type":"integer","minimum":0}},"required":["catalogId","categoryId"],"additionalProperties":false}
```
