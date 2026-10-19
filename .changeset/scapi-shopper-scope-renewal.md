---
'@salesforce/b2c-tooling-sdk': patch
---

SCAPI shopper calls now start a new guest session after a 403 whose token lacks the operation's scopes, so scopes added to the SLAS client take effect without restarting the MCP server
