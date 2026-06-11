---
'@salesforce/b2c-agent-plugins': patch
---

Skills now consistently document that the CLI auto-discovers configuration (instance, credentials, tenantId, etc.) from `dw.json`, `SFCC_*` env vars, `~/.mobify`, and `package.json` — flags like `--server`, `--client-id`, and `--client-secret` are usually unnecessary. Each instance-touching skill points agents at `b2c setup inspect` for resolved values and sources, and back to `b2c-config` for setup troubleshooting.

The `b2c-config` skill has been broadened to be the fallback whenever CLI setup or authentication is unclear, with general configuration guidance (including the fact that `dw.json` keys accept both camelCase and kebab-case) and a richer troubleshooting section.

The `b2c-custom-api-development` skill now describes Custom API cartridge-path lookup correctly: storefront `siteId` resolves through that site's cartridge path, while `siteId=Sites-Site` (the system-defined BM/organization site identifier) and an omitted `siteId` resolve through the Business Manager cartridge path. The skill shows how to manage paths with `b2c sites cartridges` and clarifies when `b2c code deploy --reload` is required (registration, contract, or cartridge-path changes) versus when a plain redeploy suffices (implementation-only edits to an already-registered endpoint).
