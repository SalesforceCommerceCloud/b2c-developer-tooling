---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-docs': patch
---

Document Cursor as a first-class skills target. The agent skills guide now has a dedicated Cursor section covering its skill discovery locations, including its compatibility with Claude Code and Codex skill paths (`.claude/skills/`, `~/.claude/skills/`, `.codex/skills/`, `~/.codex/skills/`) — so plugins installed via `claude plugin install` are auto-picked-up by Cursor with no additional setup. Cursor also now appears with its cube icon in the docs code-group tabs alongside Claude Code, Codex, and Copilot. Updated the canonical Cursor docs URL surfaced by `b2c setup skills` to `https://cursor.com/docs/skills`.
