---
type: llm
---

The answer explains that alert IDs must be declared in an alert descriptor JSON file (for example `alerts.json`) that is referenced from the cartridge's `package.json` through an `alerts` property, with the path given relative to `package.json`. Mentioning that the cartridge must be assigned to the Business Manager site is a plus but not required. FAIL if the answer invents a different registration mechanism (for example Business Manager configuration only, `bm_extensions.xml` alone, or a custom object) or omits the `package.json` reference.
