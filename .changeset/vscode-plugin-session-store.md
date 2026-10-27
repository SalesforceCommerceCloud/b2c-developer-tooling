---
'b2c-vs-extension': minor
---

New `b2c-dx.auth.usePluginSessionStore` setting keeps sign-in sessions in an installed B2C CLI plugin's auth session store instead of VS Code secret storage, so the extension and the CLI share sessions. Off by default.
