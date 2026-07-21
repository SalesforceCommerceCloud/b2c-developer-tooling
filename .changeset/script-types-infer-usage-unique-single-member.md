---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API usage inference now also recovers a type from a single accessed member when that member uniquely identifies one Script API class (e.g. `addressBook.addresses` only matches `dw.customer.AddressBook`), instead of only ever guessing from two or more accessed members. A lone member name that's shared by several classes (e.g. the common `.custom` attribute pattern) is still correctly left unresolved rather than guessed at.
