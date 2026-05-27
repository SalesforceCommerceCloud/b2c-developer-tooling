# B2C DX Walkthrough Media Assets

This directory contains markdown content and media assets for the **B2C Commerce Development** getting started walkthrough.

## Files

### Markdown Content

| File | Purpose | Used In Step |
|------|---------|--------------|
| `welcome.md` | Introduction and overview | Step 1: Welcome |
| `dw-json-setup.md` | Guide for creating dw.json config | Step 2: Configure Instance |
| `oauth-setup.md` | OAuth credentials setup instructions | Step 3: Setup OAuth |
| `webdav-browser.md` | WebDAV browser feature overview | Step 4: Explore WebDAV |
| `cartridge-structure.md` | Cartridge structure and detection | Step 5: Setup Cartridges |
| `deploy-cartridge.md` | Cartridge deployment guide | Step 6: Deploy Code |
| `sandbox-explorer.md` | Sandbox management instructions | Step 7: Manage Sandboxes |
| `code-sync.md` | Code Sync feature documentation | Step 8: Enable Code Sync |
| `next-steps.md` | Advanced features and resources | Step 9: Next Steps |

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
