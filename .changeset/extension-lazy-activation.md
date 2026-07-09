---
'b2c-vs-extension': minor
---

The extension no longer activates on every VS Code startup. It now activates on demand when you open a B2C Commerce workspace (detected via `dw.json`, `.project`, `cartridge/*.properties`, or `commerce-app.json`), open a B2C view, or run a B2C command — reducing startup overhead in unrelated projects.

Adds an opt-in `b2c-dx.features.sandboxFilesystem` setting (default off) that automatically mounts the active instance's WebDAV filesystem as a workspace folder.
