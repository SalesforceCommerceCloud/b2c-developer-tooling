---
type: llm
---

PASS if the response says a new page is created offline (not live) and must be set online in Business Manager, and gives at least one other platform caveat: there is no API to read back or delete the page, an existing page's type cannot be changed, updates merge per region, or missing required attributes are not rejected by the server.
FAIL if the response claims the API publishes the page, suggests the Shopper Experience getPage to read back the new (offline) page, or uses library XML `component.`-prefixed type IDs in the request body.
