---
type: llm
---

PASS if the response says the page is saved as a draft (or not published/activated) and must be activated separately, and gives at least one other platform caveat: there is no API to read back or delete the page, an existing page's type cannot be changed, updates merge per region, or missing required attributes are not rejected by the server.
FAIL if the response claims the API publishes the page, suggests the Shopper Experience getPage to read back a draft, or uses library XML `component.`-prefixed type IDs in the request body.
