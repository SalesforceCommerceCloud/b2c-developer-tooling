---
description: Reading a deployed cartridge file goes to the WebDAV tools, not SCAPI code mode. The fixture has no client secret, so calls fail at auth; only the routing is graded.
tags: [tier0, routing, scapi]
max_turns: 10
env:
  EVAL_MCP_PROJECT: sandbox-project
---

The `Home.js` controller in `app_custom` may have been changed on the instance since my last deploy. Fetch the copy that's actually deployed in the active code version on my B2C Commerce instance so I can compare it with my local file.
