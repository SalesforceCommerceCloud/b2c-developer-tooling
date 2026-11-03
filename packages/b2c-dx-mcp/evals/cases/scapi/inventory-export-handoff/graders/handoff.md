---
type: llm
---

PASS if the response describes starting the export and checking its status through the inventory impex API, and says the file download itself returns binary content this tool cannot read, so it must be fetched with an external HTTP client (with an access token) or another tool.
FAIL if the response claims it can download and return the file contents through code mode, or claims the export was run.
