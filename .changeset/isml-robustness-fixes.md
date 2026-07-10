---
'b2c-vs-extension': patch
---

Harden ISML language support:

- Treat `<isslot>`, `<ismodule>`, and `<iscomponent>` as empty (self-closing) elements, so auto-close no longer inserts invalid closing tags and diagnostics no longer report them as "not closed".
- Ignore markup inside `<iscomment>` and `<isscript>` bodies — commented-out ISML and `<` characters in scripts no longer produce false diagnostics, folding, or symbols.
- Debounce diagnostics so large templates are not re-linted on every keystroke.
- Guard the "create template" command against being run directly from the command palette.
- Resolve template links without the `vscode-html-languageservice` dependency, removing a fragile deep import into that package's internals.
