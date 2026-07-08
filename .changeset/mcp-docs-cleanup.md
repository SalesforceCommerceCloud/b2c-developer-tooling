---
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-agent-plugins': patch
---

Reworked the MCP Server documentation to be leaner and human-focused: trimmed internal implementation prose from the tool reference pages, reorganized the nav around toolsets and logical tool groups (combined the two log pages and the two SCAPI custom-API pages, with client-side redirects from the old URLs), corrected the project-type auto-detection table, and removed agent-directed prompting guidance. Renamed the homepage/header "Agent Skills" entry to "Agent Plugins" and grouped the MCP plugin with the core plugins in the install instructions. The `b2c-docs` skill now notes that the MCP `docs_*` tools offer the same coverage as the CLI.

The `tooling` documentation corpus (the CLI/MCP/SDK guides available via `docs search`/`read`) no longer bundles a copy of each page's markdown in the SDK — like the Developer Center guides, its content is now fetched online from the docs site at read time (with an offline fallback to the indexed summary). This shrinks the package and stops doc edits from duplicating content into the SDK.
