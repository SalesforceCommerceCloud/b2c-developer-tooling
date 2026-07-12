---
'b2c-vs-extension': minor
---

Improve ISML diagnostics and hover help:

- Add four diagnostics that catch common structural mistakes: `<iselse>`/`<iselseif>` outside an `<isif>`, `<isbreak>`/`<isnext>`/`<iscontinue>` outside an `<isloop>`, `<isreplace>` outside an `<isdecorate>`, and `<isprint>` setting both `style` and `formatter`.
- The `encoding="off"` output-escaping warning (stored-XSS risk) is now on by default and fires for every tag with an `encoding` attribute (previously it was opt-in and only checked a subset of tags). Silence it per line with `<iscomment> b2c-dx-disable-next-line encoding-off </iscomment>` or globally via `b2c-dx.isml.diagnostics.disabledRules`.
- Correct and expand tag hover text (fixes an inaccurate `<isscript>` tip, documents `<isloop>` status properties, `<isprint>` style/formatter, and `<iscontent>` placement).
