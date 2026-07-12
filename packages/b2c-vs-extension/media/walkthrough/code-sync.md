# Code Sync (Automatic Deployment)

**Code Sync** watches your cartridge files and automatically uploads changes as you save. Perfect for rapid development!

## What is Code Sync?

Code Sync is a **file watcher** that:
- Monitors your cartridge files for changes
- Automatically uploads modified files to your B2C instance
- Shows upload status in the status bar
- Supports multiple cartridges simultaneously

## Starting Code Sync

Click **Start Code Sync** above, or:
1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **B2C DX - Code Sync: Start Code Sync**

You'll see a status bar item: **$(sync~spin) Code Sync: Active**

## Stopping Code Sync

Click **Stop Code Sync** above, or:
- Click the **$(sync~spin)** status bar item
- Run **B2C DX - Code Sync: Stop Code Sync** from Command Palette

## What Gets Synced?

Code Sync monitors these file types in your cartridges:
- `.js` - Scripts and controllers
- `.ds` - Scripts (DemandWare Script)
- `.isml` - Templates
- `.xml` - Forms and metadata
- `.properties` - Configuration files
- `.css` - Stylesheets
- `.scss` / `.sass` - Sass files
- `.json` - JSON configuration
- Images (`.png`, `.jpg`, `.svg`, etc.)

### Excluded Files
Code Sync ignores:
- `node_modules/`
- `.git/`
- Build artifacts
- `.project` files

## Status Bar Indicators

### $(sync~spin) Code Sync: Active
Watching for file changes.

### $(cloud-upload) Uploading: filename.js
Currently uploading a file.

### $(check) Upload Complete
File uploaded successfully.

### $(error) Upload Failed
Upload encountered an error. Check Output panel.

## Configuration

Control Code Sync behavior in Settings (`Cmd+,` / `Ctrl+,`):

### Enable/Disable Code Sync
```json
"b2c-dx.features.codeSync": true
```

## How It Works

1. **Save a file** in a cartridge
2. Code Sync **detects the change**
3. File is **uploaded** to WebDAV (`/Cartridges/<cartridge>/...`)
4. B2C instance **updates** the active code version
5. Changes are **immediately available** (no restart needed for most files)

## Best Practices

### ✅ When to Use Code Sync

- **Rapid development**: Making frequent small changes
- **Template editing**: ISML template development
- **CSS/JS tweaks**: Front-end styling adjustments
- **Debugging**: Quick fixes to test theories

### ❌ When NOT to Use Code Sync

- **Large refactoring**: Many file changes at once (use manual deploy)
- **Production deployments**: Always use manual deploy for production
- **Multiple cartridges**: Deploy all at once with manual deploy
- **First deployment**: Use manual deploy to ensure everything uploads

## Performance Tips

💡 **Watch the Output panel**: Monitor upload progress and errors in **B2C DX** output.

💡 **Stop when not developing**: Disable Code Sync when not actively coding to save resources.

💡 **Use .gitignore patterns**: Code Sync respects `.gitignore` files.

💡 **Exclude large files**: Don't upload huge images or videos via Code Sync (use WebDAV browser for bulk uploads).

## Troubleshooting

### Files Not Uploading?
- Check Output panel for errors
- Verify `dw.json` credentials
- Ensure cartridge is detected (Cartridges view)
- Confirm Code Sync is active (status bar)

### Upload Delays?
- Network latency can slow uploads
- Large files take longer
- Check your internet connection

### Changes Not Visible on Storefront?
- Some changes require **cache clearing**
- Templates update immediately
- Controllers may need instance restart
- CSS/JS may be cached in browser (hard refresh)

## Toggle Code Sync

You can also **toggle** Code Sync on/off:
- Run **B2C DX - Code Sync: Toggle Code Sync** from Command Palette
- Quickly enable/disable without separate commands

---

Click **Start Code Sync** to enable automatic deployment!
