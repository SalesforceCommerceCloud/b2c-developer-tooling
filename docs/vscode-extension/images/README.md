# Screenshot placeholders

Each `<slot>.svg` in this directory is a visible "Screenshot placeholder" used by the VS Code extension docs pages. They render as dashed-border boxes with the slot title and a description, so reviewers can see exactly where a real screenshot belongs.

## Replacing a placeholder

1. Capture the screenshot as a PNG at retina resolution (typically ~2560×1440 max).
2. Save it as `./<slot>.png` in this directory (use the same `<slot>` name as the SVG).
3. In the markdown page that references it, swap the `.svg` extension for `.png`:

   ```diff
   - ![Sandbox Realm Explorer](./images/sandbox-explorer.svg)
   + ![Sandbox Realm Explorer](./images/sandbox-explorer.png)
   ```

4. Remove the corresponding `<!-- TODO(screenshot): … -->` comment.
5. (Optional) Delete the `.svg` placeholder once all slots referencing it are replaced.

To enumerate every remaining placeholder, grep the docs:

```bash
grep -rn "TODO(screenshot)" docs/vscode-extension/
```

## Slot inventory

| Slot | Used on |
| ---- | ------- |
| `overview` | `index.md` |
| `sandbox-explorer`, `sandbox-context-menu` | `features.md`, `index.md` |
| `webdav-browser`, `webdav-mounted` | `features.md`, `index.md` |
| `content-libraries` | `features.md` |
| `code-sync` | `features.md`, `index.md` |
| `api-browser` | `features.md` |
| `script-debugger` | `features.md`, `index.md` |
| `page-designer-assistant` | `features.md`, `index.md` |
| `scaffold-picker` | `features.md` |
| `release-assets`, `install-vsix` | `installation.md` |
| `settings`, `output-channel` | `configuration.md` |
