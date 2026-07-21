---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API usage inference now also recognizes a `'member' in obj` existence check (e.g. `'Subsoort' in apiProduct.custom`) as evidence of that member, not just a direct `obj.member` read. This is a very common SFCC idiom for guarding an optional custom attribute before reading it, and previously produced no usage evidence at all when it was the only access on an undocumented parameter.
