**Install the plugin** <span class="recommended VPBadge">Recommended</span>

<!--@include: ./mcp-plugin-claude.md-->

Start a new Claude Code session. To install for the current project only, run it from your project directory with `--scope project`.

<details class="details custom-block" data-setup-anchor="claude-manual">
<summary>Manual MCP setup</summary>

```bash
claude mcp add --transport stdio --scope user b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Start a new session. To configure the current project only, run it from your project directory with `--scope project`.
See [Claude Code MCP setup](https://code.claude.com/docs/en/mcp).

</details>

[Claude Desktop setup](/mcp/#claude-desktop)
