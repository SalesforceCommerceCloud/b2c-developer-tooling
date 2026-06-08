---
'b2c-vs-extension': patch
---

Correctness and UX hardening pass across the extension:

- **Content libraries**: `ContentFileSystemProvider.stat()` now returns a stable `mtime` instead of `Date.now()` per call. VS Code no longer believes content files are constantly mutating, eliminating phantom "file modified externally" prompts and silent buffer reloads that could clobber unsaved edits.
- **WebDAV explorer**: F2-rename now works. The `rename()` method delegates to the SDK's `webdav.move` (already used by drag-and-drop) instead of throwing `NoPermissions`. Cross-root attempts and 412 conflicts are mapped to the right `vscode.FileSystemError`.
- **Activation performance**: replaced sync `fs.readFileSync` / `existsSync` / `statSync` on the activation hot path (`B2CExtensionConfig`) and in the per-paint CAP file-decoration provider with `vscode.workspace.fs` async equivalents and a Set lookup, respectively. CAP decorations now answer in O(1) without filesystem syscalls.
- **Cancellation**: long-running operations (sandbox clone polling, CAP install, deploy, content export, Swagger UI proxy fetches) now show a working Cancel button. Cancelling stops the local poll/wait; aborting the server-side operation requires SDK `AbortSignal` support which is a separate change.
- **Tree state stability**: every tree provider (sandbox, WebDAV, content libraries, API browser, cartridges) now sets a stable `TreeItem.id`, so expand/collapse state survives refresh and `treeView.reveal()` works without try/catch fallback.
- **Safety + telemetry coverage**: 11 contributed commands previously bypassed `registerSafeCommand`, including `b2c-dx.sandbox.clone` (a billable operation). All now route through the safety guard and feature-usage telemetry. Added a `scriptTypes` feature category and command-prefix mapping.
- **Dead code removal**: removed an unused `createDeleteAndDeployCommand`, the unused `tempDirs` cleanup loop in `cartridge-commands`, the dead `openExternal` branch in the Page Designer webview message handler, and the never-implemented `b2c-dx.codeSync.diffCartridge` command.
