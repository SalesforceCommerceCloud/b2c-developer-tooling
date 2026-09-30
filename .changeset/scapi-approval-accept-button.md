---
'@salesforce/b2c-dx-mcp': patch
---

SCAPI Safety Mode approvals now use the client's own Accept/Decline buttons instead of an extra "Approve this request only" checkbox, so clicking Accept in GUI clients such as the ChatGPT Work app no longer declines the request. Dismissing the prompt now reports `SCAPI_APPROVAL_CANCELLED`, separate from a decline.
