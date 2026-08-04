---
'@salesforce/b2c-tooling-sdk': patch
---

Refresh the bundled documentation corpora to the 26.8 release so `b2c docs
search`/`docs read` and the MCP `docs_*` tools surface the latest content:

- Script API reference and XSD schemas updated to DWAPP 26.8 (adds the
  `dw.commerceapps` package, connection-health hooks, and `ShippingHooks`).
- Developer Center guides refreshed (adds newly published guides such as SCAPI
  CDN caching, guest order access codes, and several Storefront Next topics).

Each corpus index now records where it came from so maintainers can spot the
delta before a refresh: git-sourced prose corpora store the upstream commit
(`source` block) and DWAPP-sourced corpora store the platform release
(`platformDocVersion`, e.g. "DWAPP 26.8").
