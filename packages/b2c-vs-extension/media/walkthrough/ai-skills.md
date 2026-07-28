# Set up Agent Skills & MCP

The B2C developer toolkit ships an **MCP server** and a set of **Agent Skills** that let Claude Code, Cursor, GitHub Copilot, and similar tools share context with your B2C project. Configure them once and your AI tools learn the same instance, dw.json, and cartridge layout this extension already understands.

## MCP server

The MCP server exposes B2C-specific tools (deploy, log queries, sandbox info) to any MCP-aware client. Configuration is project-scoped — drop a JSON snippet into your client's MCP config and you're done.

[MCP server setup guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/) — includes copy-paste snippets for Claude Code, Cursor, and Copilot.

## Agent Skills

Agent Skills bundle B2C-specific instructions, prompts, and conventions that your IDE's AI features can reference. They keep code generation grounded in B2C patterns rather than generic JavaScript.

[Agent Skills installation](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/agent-skills.html)

## Pairing with this extension

- The **Prompt Agent** command (Cursor only) opens a Cursor chat with whatever prompt you type — useful for round-tripping context out of VS Code.
- Keep `dw.json` at the project root; both the MCP server and this extension look there first.
- Set secrets via environment variables (see the dw.json step) so AI tools don't accidentally surface them in context windows.
