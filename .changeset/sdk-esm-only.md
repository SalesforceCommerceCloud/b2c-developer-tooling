---
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': patch
---

The SDK is now ESM-only — the dual-format `dist/cjs` build has been removed and the package exports map exposes only ESM. CommonJS consumers that previously did `require('@salesforce/b2c-tooling-sdk')` from a CJS package must either switch to `import` or rely on Node's `require(esm)` (Node ≥22.12). The VS Code extension has been converted to a `"type": "module"` package; its bundled entry is now `dist/extension.cjs`.
