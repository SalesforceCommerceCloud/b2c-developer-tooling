---
'b2c-vs-extension': minor
---

Add ISML document formatting and expand ISML diagnostics.

**Formatting.** ISML files now support Format Document and Format Selection, powered by the same engine as VS Code's built-in HTML formatter (`vscode-html-languageservice`). `<isscript>` bodies and `${...}` expressions are preserved verbatim, and void ISML tags are normalized to `<isxxx/>`. Configurable via `b2c-dx.isml.format.*` and gated by `b2c-dx.features.ismlFormatting`.

**Diagnostics.** Added required-attribute checks (e.g. `<isif>` needs `condition`, `<isloop>` needs an iterator and an alias, `<isinclude>` needs `template` or `url`) and an opt-in `encoding="off"` output-escaping warning. Every diagnostic now carries a stable rule code shown in the Problems panel.

**Suppression & configuration.** Individual lines can be suppressed inline with an ISML comment directive — `<iscomment> b2c-dx-disable-next-line <code> </iscomment>` (or `b2c-dx-disable-line`, or no code to suppress all rules on the line) — offered as a quick fix on any diagnostic. Rules can be disabled project-wide via `b2c-dx.isml.diagnostics.disabledRules` (the `encoding-off` warning is disabled by default).
