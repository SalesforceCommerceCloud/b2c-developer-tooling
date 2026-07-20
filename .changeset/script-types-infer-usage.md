---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Script API IntelliSense can now infer types for undocumented helper functions from how they're actually called elsewhere in your project, instead of silently falling back to `any` and losing hover/completion for everything downstream. This is off by default — enable it with the `b2c-dx.features.scriptTypesInferUsage` VS Code setting (or `inferUsage: true` in the plugin config for other LSP hosts). Inferred results are clearly labeled ("Inferred from usage") since they're heuristic. `@salesforce/b2c-cli` picks this up too since `b2c setup ide vscode-types`/`tsserver-plugin` bundle the same plugin.
