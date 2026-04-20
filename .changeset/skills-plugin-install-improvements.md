---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-docs': patch
---

Broaden skills-plugin install support and improve the installation docs.

- Add a Codex plugin marketplace so the three plugins (`b2c-cli`, `b2c`, `b2c-dx-mcp`) can be installed directly from Codex CLI's plugin directory.
- Add a new `b2c-onboarding` skill (in the `b2c` plugin) that walks new developers through CLI verify, `dw.json` setup, sandbox connect, and first cartridge deploy, then hands off to the topic-specific skill for the user's goal.
- Add per-plugin READMEs with install instructions for each supported client.
- Add optional offline validation scripts for generated metadata XML (`b2c-metadata`) and `dw.json` (`b2c-config`).
- Document Copilot CLI + VS Code Copilot install paths and the Codex marketplace install path.
- Remove the `b2c-experimental` plugin from the public marketplace.
