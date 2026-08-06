---
'@salesforce/b2c-cli': major
'@salesforce/b2c-tooling-sdk': major
'b2c-vs-extension': minor
'@salesforce/b2c-dx-docs': minor
'@salesforce/b2c-agent-plugins': patch
---

Migrate `job`, `code`, `bm users`, `bm roles`, `sites`, and catalog discovery to SCAPI-first operation with a temporary OCAPI compatibility fallback. `auto` tries SCAPI when its coordinates and stateless authentication are available, pins the selected backend for multi-request operations, and falls back only on safe capability/auth/request rejections. Site cartridge-path writes, portable BM user search, disabled-user updates, system-job triggers, SDK/CLI/MCP code-version discovery, and VS Code jobs/code/catalog surfaces now participate. Inventory-list enumeration, BM `whoami`, access-key administration, raw OCAPI user-search JSON, and running-job cancellation remain explicit OCAPI compatibility operations because the current live SCAPI schemas have no equivalent.

`setup instance create` accepts optional SCAPI coordinates for SCAPI-first active-code-version detection. They are not required in `auto`; missing coordinates select OCAPI, and failed interactive detection reports the reason before allowing manual entry.

This is a major release because SCAPI and OCAPI JSON/results intentionally retain their backend-specific shapes. Consumers that require a stable legacy shape must explicitly select OCAPI or use the exported compatibility/fallback primitives during the migration. SDK high-level code helpers accept an explicit scripts backend; dual-backend factories and `JobsCompatibilityBackend` expose reusable fallback without making implicit backend selection an SDK-wide policy.

SCAPI currently requires client-credentials or JWT Bearer authentication. Browser-based user auth continues through OCAPI/WebDAV and is selected by `auto`; explicit SCAPI with user auth errors clearly until the platform adds support.
