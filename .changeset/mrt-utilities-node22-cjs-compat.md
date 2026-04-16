---
'@salesforce/mrt-utilities': patch
---

Fixed CommonJS packaging for Node 22 by ensuring `require` entrypoints under `dist/cjs` are emitted as true CJS modules. Added dedicated `@salesforce/mrt-utilities/data-store` and `@salesforce/mrt-utilities/middleware/express` entrypoints so data-store imports do not have to load the Express middleware barrel during startup.
