---
'@salesforce/b2c-cli': patch
---

Fix `slas client update` corrupting existing callback URIs. When merging with the current client, the command split the API's pipe-delimited `callbackUri` value on commas instead of pipes, so the entire list was sent back as a single string and the update was rejected with "CallbackURI must be a valid URL". Callback URIs are now parsed with the same shared helper used for redirect URIs everywhere in the SLAS commands, so the two paths can no longer disagree.
