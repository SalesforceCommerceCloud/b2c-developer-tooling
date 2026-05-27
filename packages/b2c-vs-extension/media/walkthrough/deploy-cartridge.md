# Deploy Your First Cartridge

Deploying cartridges is the core workflow for B2C Commerce development. Upload your local code to your B2C instance with a single command!

## Deployment Methods

### Method 1: Deploy All Cartridges
Click **Deploy All Cartridges** above to upload all cartridges in your workspace.

This creates a ZIP archive of each cartridge and uploads them to your instance's active code version.

### Method 2: Deploy Individual Cartridge
1. Open the **Cartridges** view (B2C-DX sidebar)
2. Right-click a cartridge
3. Select **Upload Cartridge**

### Method 3: Command Palette
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "B2C: Deploy"
3. Select **B2C DX - Code Sync: Deploy Cartridges**

## What Happens During Deployment

1. **Packaging**: Extension creates a ZIP archive of the cartridge
2. **Upload**: ZIP is uploaded via WebDAV to `/Cartridges/`
3. **Extraction**: B2C instance automatically extracts the cartridge
4. **Activation**: Cartridge is available in the active code version

## Monitoring Deployment

Watch the **Output** panel for deployment progress:
1. View → Output
2. Select **B2C DX** from the dropdown

You'll see logs like:
```
[INFO] Starting cartridge upload: my_cartridge
[INFO] Creating archive...
[INFO] Uploading to /Cartridges/my_cartridge...
[INFO] Upload complete! (2.3 MB in 1.2s)
```

## Code Versions

Cartridges are deployed to the **active code version** on your instance.

### Viewing Code Versions
Click the **Code Versions** icon in the Cartridges view to see all code versions on your instance.

### Creating a New Code Version
1. Click **Code Versions** in Cartridges view
2. Click **Create Code Version**
3. Enter a version name
4. Optionally activate it

### Activating a Code Version
1. Click **Code Versions**
2. Select a version
3. Click **Activate Code Version**

## Troubleshooting

### ❌ "Upload failed: Authentication required"
- Check your `dw.json` credentials
- Verify hostname, username, and password are correct

### ❌ "Upload failed: Permission denied"
- Ensure your user has WebDAV upload permissions
- Check Business Manager user roles

### ❌ "Cartridge not found on instance"
- After uploading, the cartridge appears in the cartridge path
- Verify upload succeeded in Output panel

### ❌ "Code version is read-only"
- You cannot upload to a locked code version
- Create a new code version or unlock the current one

## Next Steps

After deploying:
- **Test your changes**: Visit your storefront to see updates
- **Check logs**: Use the **Start Tailing Logs** command to view instance logs
- **Debug**: Use the B2C Script Debugger to debug server-side code

---

Click **Deploy All Cartridges** to upload your code now!
