# B2C DX Extension Test Workspace

This directory serves as a sample B2C Commerce project for testing the extension and walkthrough features.

## Purpose

Testing the B2C DX extension requires a workspace with:
- Proper cartridge structure (`.project` files)
- Configuration files (`dw.json`)
- Typical B2C Commerce project layout

## Usage

### Option 1: Use This Test Workspace

```bash
# From the extension directory
cd packages/b2c-vs-extension

# Open the test workspace in Extension Development Host
code test-workspace --extensionDevelopmentPath=$(pwd)
```

### Option 2: From VS Code

1. Build the extension: `pnpm run build`
2. Press **F5** to launch Extension Development Host
3. In the new window: **File → Open Folder**
4. Navigate to: `packages/b2c-vs-extension/test-workspace`
5. Click **Open**

### Option 3: Add to launch.json

The `.vscode/launch.json` is already configured to open this workspace automatically.

## What's Included

```
test-workspace/
├── README.md              (this file)
├── .gitignore            (ignores dw.json)
├── cartridges/           (sample cartridges)
│   ├── app_storefront_base/
│   │   ├── .project
│   │   └── cartridge/
│   └── int_custom/
│       ├── .project
│       └── cartridge/
└── package.json          (project metadata)
```

## Testing Scenarios

### Test 1: Fresh Project (No dw.json)
1. Delete `dw.json` if it exists
2. Reload extension
3. Should trigger first-time welcome prompt
4. Click "Create dw.json Template"
5. Verify dw.json is created

### Test 2: Existing Project (With dw.json)
1. Keep existing `dw.json`
2. Reload extension
3. Walkthrough Step 2 should auto-complete
4. Cartridges should be detected

### Test 3: Cartridge Detection
1. Open **Cartridges** view
2. Should show 2 cartridges:
   - app_storefront_base
   - int_custom

## Updating Configuration

Edit `dw.json` with your actual B2C instance credentials:

```json
{
  "hostname": "your-sandbox.demandware.net",
  "username": "your-username",
  "password": "your-password",
  "version": "v1"
}
```

**Remember:** Never commit real credentials to Git!

## Cleanup

To reset the test workspace:

```bash
# Remove generated files
rm dw.json
rm .gitignore

# Or use the cleanup script
./cleanup.sh
```
