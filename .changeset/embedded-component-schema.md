---
'@salesforce/b2c-tooling-sdk': minor
---

Add `embedded` and `component_id` properties to the component type schema with conditional validation requiring `component_id` when `embedded` is `true`. Improve validation error messages to show human-readable output instead of raw JSON Schema subschema references.
