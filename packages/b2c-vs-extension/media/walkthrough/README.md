# B2C DX Walkthrough Media Assets

This directory contains markdown content and media assets for the **B2C Commerce Development** getting started walkthrough.

## Files

### Markdown Content

Step IDs come from `src/walkthrough/personas.ts` (`STEP_CATALOG`). Each persona in `PERSONAS` picks a subset and ordering of these.

| File | Step ID | Purpose |
|------|---------|---------|
| `welcome.md` | `welcome` | Intro and the universal five-step path |
| `install-cli.md` | `install-cli` | Optional B2C CLI install (npm / brew / npx) |
| `dw-json-setup.md` | `configure-dw-json` | dw.json layout, credential grouping, resolution precedence |
| `oauth-setup.md` | `setup-oauth` | client-id / client-secret in the active config |
| `webdav-browser.md` | `explore-webdav` | username / password and the WebDAV view |
| `cartridge-structure.md` | `setup-cartridges` | Cartridge layout, `.project` detection, SCAPI fields |
| `deploy-cartridge.md` | `deploy-code` | First deploy via Cartridges view / `b2c-dx.codeSync.deploy` |
| `sandbox-explorer.md` | `manage-sandboxes` | Realm + sandbox lifecycle (DevOps persona) |
| `code-sync.md` | `enable-code-sync` | Auto-deploy on save |
| `ai-skills.md` | `ai-skills` | Agent Skills + MCP install (AI-augmented persona) |
| `next-steps.md` | `next-steps` | Where to go after onboarding |

### Image Assets (To Be Added)

The following image assets should be created for enhanced walkthrough experience:

| File | Description | Dimensions |
|------|-------------|------------|
| `welcome.png` | Extension overview banner | 800x400 |
| `dw-json-example.png` | Screenshot of configured dw.json | 600x400 |
| `oauth-credentials.png` | Account Manager OAuth setup | 800x500 |
| `webdav-tree.png` | WebDAV browser showing cartridges | 400x600 |
| `cartridge-explorer.png` | Cartridges view with detected cartridges | 400x500 |
| `deploy-success.png` | Deployment success notification | 600x200 |
| `sandbox-explorer.png` | Sandbox Explorer with realms | 400x600 |
| `code-sync-active.png` | Status bar with Code Sync enabled | 800x100 |
| `api-browser.png` | API Browser with Swagger UI | 800x600 |

### GIF Assets (Optional Enhancement)

For more engaging walkthrough experience:

| File | Description | Duration |
|------|-------------|----------|
| `webdav-navigation.gif` | Animated demo of browsing WebDAV | 5-10s |
| `deploy-cartridge.gif` | Animated deployment process | 5-10s |
| `code-sync-demo.gif` | Live demo of file save → auto-upload | 5-10s |

## Adding Images

To add image assets:

1. Create or capture screenshots/images
2. Save them in this directory with the names above
3. Update package.json walkthrough steps to reference images:

```json
"media": {
  "image": "media/walkthrough/welcome.png",
  "altText": "B2C DX Extension welcome screen"
}
```

Or keep using markdown files:

```json
"media": {
  "markdown": "media/walkthrough/welcome.md"
}
```

## Guidelines

### Screenshot Guidelines
- Use light theme for consistency
- Crop to relevant UI elements
- Highlight important elements (arrows, boxes)
- Use high-resolution images (2x for Retina displays)

### Markdown Guidelines
- Keep content concise and scannable
- Use headings, bullets, and code blocks
- Include emoji sparingly for visual interest
- Link to relevant commands using `command:` URIs

### Accessibility
- Always provide `altText` for images
- Ensure markdown is readable without images
- Use semantic headings in markdown files
- Test with screen readers if possible

## Testing

To test the walkthrough:

1. Build the extension: `pnpm run build`
2. Press F5 to launch Extension Development Host
3. Open Command Palette: `Cmd+Shift+P`
4. Run: **Welcome: Open Walkthrough...**
5. Select: **Get Started with B2C Commerce Development**

## Maintenance

When updating walkthrough content:
- Update this README if adding/removing files
- Keep markdown files synced with actual extension features
- Test all command links to ensure they work
- Update completion events if command IDs change
