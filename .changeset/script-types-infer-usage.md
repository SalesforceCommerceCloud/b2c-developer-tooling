---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Script API IntelliSense can now infer types for undocumented cartridge helpers the way IntelliJ does, instead of falling back to `any` and losing hover and completions for everything downstream. Types come from call-site arguments (including `new`, `.call`/`.apply` and callbacks), return values, the typed Script API calls a value is passed to, and the members and `instanceof`/`typeof` checks in the helper's own body, followed through object members, arrays, factory-returned models and `HookMgr.callHook` calls into the hook scripts `hooks.json` registers; call sites that disagree show a union of up to three types (`Product | Category`). Results are labeled "Inferred from usage", real `dw.*` and `{any}` JSDoc are never overridden, and placeholder SFRA JSDoc such as `@param {Object}` no longer blocks inference. It is off by default: enable the `b2c-dx.features.scriptTypesInferUsage` VS Code setting, or pass `inferUsage: true` in the plugin config for other LSP hosts (the plugin from `b2c setup ide tsserver-plugin`).
