---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Script API IntelliSense can now infer types for undocumented cartridge helpers from how they are used across the project, so hover and completions keep working where they used to fall back to `any`. Off by default: enable the `b2c-dx.features.scriptTypesInferUsage` VS Code setting, or pass `inferUsage: true` in the tsserver plugin config for other editors. See the IDE integration guide for details.
