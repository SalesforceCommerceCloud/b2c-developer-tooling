---
'@salesforce/b2c-tooling-sdk': minor
---

Allow `embedded: true` component types on `arch_type: controller`. Previously the component type schema required `arch_type` to be `headless` whenever `embedded` was `true`; embedded content blocks (ECBs) are now supported on both headless and controller storefronts. The `embedded` ⟺ `component_id` requirement is unchanged.
