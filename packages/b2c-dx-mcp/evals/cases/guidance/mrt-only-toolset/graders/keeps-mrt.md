---
type: llm
---

PASS if the response recommends a server configuration that keeps the MRT toolset and adds the DIAGNOSTICS toolset (for example `--toolsets MRT,DIAGNOSTICS`), or that removes the toolset restriction so all toolsets are enabled.
FAIL if the recommended configuration drops MRT, names a toolset that does not exist, or claims the configuration was changed.
