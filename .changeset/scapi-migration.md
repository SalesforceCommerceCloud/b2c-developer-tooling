---
'@salesforce/b2c-cli': major
'@salesforce/b2c-tooling-sdk': major
'b2c-vs-extension': minor
'@salesforce/b2c-dx-docs': minor
'@salesforce/b2c-agent-plugins': patch
---

Migrate `job`, `code`, `bm users`, `bm roles`, `sites`, and catalog discovery to SCAPI-first operation with a temporary OCAPI compatibility fallback. `auto` tries SCAPI when its coordinates and stateless authentication are available, pins the selected backend for multi-request operations, and falls back only on safe capability/auth/request rejections. Site cartridge-path writes, portable BM user search, disabled-user updates, system-job triggers, SDK/CLI/MCP code-version discovery, and VS Code jobs/code/catalog surfaces now participate. Inventory-list enumeration, BM `whoami`, access-key administration, and raw OCAPI user-search JSON remain temporary OCAPI compatibility operations because the current live SCAPI schemas have no equivalent. Explicit SCAPI mode rejects these operations before contacting OCAPI and identifies B2C Commerce release 26.8 as the current capability baseline.

`setup instance create` accepts optional SCAPI coordinates for SCAPI-first active-code-version detection. They are not required in `auto`; missing coordinates select OCAPI, and failed interactive detection reports the reason before allowing manual entry.

This is a major release because JSON/results can change shape during the migration. `job run`, `job wait`, and `job search` return canonical camelCase fields with either backend, including OCAPI fallback; consumers must update fields such as `execution_status` to `executionStatus`. Other commands can retain backend-specific shapes, for which explicitly selecting OCAPI preserves the legacy shape. SDK high-level code helpers accept an explicit scripts backend; dual-backend factories and `JobsCompatibilityBackend` expose reusable fallback without making implicit backend selection an SDK-wide policy.

SCAPI currently requires client-credentials or JWT Bearer authentication. Browser-based user auth continues through OCAPI/WebDAV and is selected by `auto`; explicit SCAPI with user auth errors clearly until the platform adds support.

The VS Code extension uses configured tenant IDs consistently in API Browser, keeps partial export discovery warnings in the output log instead of showing notifications, and supports JWT-authenticated OCAPI fallback equivalently to client credentials.
