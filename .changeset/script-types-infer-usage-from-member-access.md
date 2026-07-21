---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Script API usage inference now also matches an undocumented parameter or local variable's own member/method accesses (e.g. `shipment.custom`, `shipment.productLineItems`) against the Script API's ambient classes when no call site or usable initializer can resolve its type at all. This recovers hover/completions for helpers only reached indirectly (e.g. dispatched from a Controller route), and for collection items pulled out with a manual indexing loop (`var item = items[i]`) instead of `collections.forEach`.

Also fixes several bugs uncovered while dogfooding this:
- Hover showed nothing when hovering the member name itself in a chained access (e.g. `productLineItems` in `shipment.productLineItems`) even though hovering the receiver worked.
- Completions were slow/unreliable on large real projects because an internal cache was invalidated on every keystroke instead of once per project session.
- Hover now shows the real declaration's own type name, documentation, and JSDoc tags (not just a bare "Inferred from usage: X" note).
- A class's nested custom-attributes interface (`ICustomAttributes.Shipment`) rendered with the same display name as the unrelated top-level class it's attached to.
- A dangling, mid-edit member access (`shipment.` immediately followed by more code on later lines — `.` never gets automatic semicolon insertion) could get parsed together with the next statement, poisoning usage-based matching with a phantom member name and silently producing no completions for the position being typed.
