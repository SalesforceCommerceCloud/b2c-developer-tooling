---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Script API IntelliSense can now infer types for undocumented cartridge helpers from how they are used across the project: call sites, return values, the Script API calls a value reaches, SFRA middleware and `hooks.json` hooks. Hover and completions keep working where they used to fall back to `any`, and inferred types are labeled "Inferred from usage". The feature is off by default: enable the `b2c-dx.features.scriptTypesInferUsage` VS Code setting, or pass `inferUsage: true` in the tsserver plugin config for other editors. See the IDE integration guide for details.
