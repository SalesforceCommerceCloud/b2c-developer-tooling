---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API usage inference now also recognizes `new Helper(x)` constructor calls as a call site when inferring a parameter's type, not just plain `helper(x)` calls. This is SFRA's other very common way to invoke an undocumented "class" model (e.g. `new ProductLineItem(...)`, `new StoreModel(...)`), which previously produced no inference at all since a `new` expression is a different AST shape than a plain call.
