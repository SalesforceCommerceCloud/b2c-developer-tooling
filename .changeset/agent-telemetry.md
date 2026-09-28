---
'@salesforce/b2c-tooling-sdk': minor
---

Anonymous usage telemetry and the HTTP User-Agent now identify the detected AI agent, so agent-driven usage can be measured. Agent session IDs are never sent; only a one-way hash groups commands from the same session.
