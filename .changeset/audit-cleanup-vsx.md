---
'b2c-vs-extension': patch
---

VS Code extension reliability fixes:

- Swagger API Browser webview no longer attempts `postMessage` after the panel has been disposed (previously could throw on token refresh or proxy responses arriving after close).
- Sandbox tree polling no longer stacks "stop-check" timers when the configured polling interval is shorter than the 3-second stabilization window.
- Code Sync now drains pending uploads/deletes before tearing down its file watchers, so saves immediately preceding a stop are no longer dropped.
