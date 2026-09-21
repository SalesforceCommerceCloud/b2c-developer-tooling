**Install the plugin** <span class="recommended VPBadge">Recommended</span>

<!--@include: ./mcp-plugin-codex.md-->

Start a new Codex session in your project. This setup also works with the Codex
IDE extension and the ChatGPT Work desktop app.

<details class="details custom-block" data-setup-anchor="codex-manual">
<summary>Manual MCP setup</summary>

```bash
codex mcp add b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Or add this to `~/.codex/config.toml` (or `$CODEX_HOME/config.toml` if customized):

```toml
[mcp_servers.b2c-dx-mcp]
command = "npx"
args = ["-y", "@salesforce/b2c-dx-mcp@latest"]
```

Start a new session. See [Codex MCP configuration](https://developers.openai.com/codex/mcp/).

</details>

[ChatGPT online setup](/mcp/#chatgpt)
