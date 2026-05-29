---
'b2c-vs-extension': minor
---

Add ISML language support: file associations for `.isml` and `.ds`, TextMate grammar for syntax highlighting (including embedded JavaScript inside `<isscript>` and `${}` expressions), language configuration for comment toggling/bracket pairs/auto-closing, ~50 snippets for common ISML constructs (conditionals, loops, includes, decorators, Page Designer slots/regions, `Resource.msg`, `URLUtils.url`, `dw/system/Logger`, `Transaction.wrap`, `BasketMgr`, and more), automatic insertion of closing tags when typing `>` after an opening ISML tag, Emmet abbreviation expansion, document links (cmd-click on `template="..."` in `<isinclude>`/`<isdecorate>`/`<ismodule>` jumps to the resolved template across the cartridge path), and breakpoint support in `.isml` files for the B2C script debugger.
