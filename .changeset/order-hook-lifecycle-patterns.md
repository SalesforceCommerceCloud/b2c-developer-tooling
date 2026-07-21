---
'@salesforce/b2c-agent-plugins': patch
---

Document the order hook lifecycle in the b2c-hooks skill: the beforePOST → afterPOST → modifyPOSTResponse sequence, Status.ERROR rollback semantics per phase, the two-hook pattern for persisting a failed order while returning an HTTP error, and request.custom for inter-hook data passing.
