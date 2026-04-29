# Congratulations! 🎉

You've completed the **B2C Commerce Development** getting started guide!

## What You've Learned

✅ Connected to your B2C Commerce instance  
✅ Explored remote files with WebDAV  
✅ Set up local cartridge development  
✅ Deployed code to your instance  
✅ Managed development sandboxes  
✅ Enabled automatic deployment with Code Sync  

## Next Steps

### Explore Advanced Features

#### 🔍 API Browser
Browse SCAPI (Salesforce Commerce API) OpenAPI specifications with interactive Swagger UI.

[Open API Browser](command:workbench.view.extension.b2c-dx-scapi)

**What you can do:**
- View all available SCAPI endpoints
- Read API documentation
- Explore request/response schemas
- Test APIs directly from Swagger UI

---

#### 📚 Content Libraries
Manage Page Designer content, pages, and components.

[Open Content Libraries](command:workbench.view.extension.b2c-dx)

**What you can do:**
- Browse content libraries
- Export pages and components
- Import site archives
- Filter content by type
- Browse static assets

---

#### 🐛 B2C Script Debugger
Debug server-side JavaScript with breakpoints and step-through debugging.

**How to use:**
1. Open Debug panel (`Cmd+Shift+D` / `Ctrl+Shift+D`)
2. Select **B2C Script Debugger** configuration
3. Press **F5** to start debugging
4. Set breakpoints in `.js` or `.ds` files

---

#### 📋 Log Tailing
Watch instance logs in real-time.

**Commands:**
- **Start Tailing Logs**: Stream logs from your instance
- **Stop Tailing Logs**: Stop log streaming

Logs appear in the **B2C DX** output panel.

---

#### 🏗️ Scaffold Generator
Generate new files from templates.

**How to use:**
1. Right-click a folder in Explorer
2. Select **B2C DX → New from Scaffold...**
3. Choose a template (controller, model, script, etc.)
4. Enter file details
5. Extension generates boilerplate code

---

#### 📦 Commerce App Packages (CAP)
Install and manage Commerce App Packages.

**How to use:**
1. Right-click a folder containing `commerce-app.json`
2. Select **B2C DX → Install Commerce App (CAP)**
3. Extension uploads and installs the app

---

## Resources

### 📖 Documentation
- [B2C Developer Tooling GitHub](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling)
- [B2C CLI Documentation](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/packages/b2c-cli)
- [VS Code Extension Guide](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/tree/main/packages/b2c-vs-extension)

### 🤝 Community
- [Report Issues](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues)
- [Contributing Guide](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/CONTRIBUTING.md)
- [Changelog](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/blob/main/packages/b2c-vs-extension/CHANGELOG.md)

### 🎓 Learning Resources
- [Salesforce B2C Commerce Documentation](https://developer.salesforce.com/docs/commerce/b2c-commerce/overview)
- [SFRA (Storefront Reference Architecture)](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture)
- [Commerce Cloud Community](https://trailblazer.salesforce.com/en/s/products/commerce-cloud)

## Keyboard Shortcuts

Speed up your workflow with these shortcuts:

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Open WebDAV Browser | `Ctrl+Shift+W` (custom) | `Cmd+Shift+W` (custom) |
| Deploy Cartridges | (Use Command Palette) | (Use Command Palette) |
| Toggle Code Sync | (Use Command Palette) | (Use Command Palette) |

💡 **Tip:** You can customize shortcuts in **Preferences → Keyboard Shortcuts**

## Extension Settings

Customize the extension in **Settings** (`Cmd+,` / `Ctrl+,`):

```json
{
  "b2c-dx.features.sandboxExplorer": true,
  "b2c-dx.features.webdavBrowser": true,
  "b2c-dx.features.contentLibraries": true,
  "b2c-dx.features.codeSync": true,
  "b2c-dx.features.apiBrowser": true,
  "b2c-dx.logLevel": "info"
}
```

## Need Help?

### 🐛 Found a Bug?
[Report an Issue](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues/new)

### 💡 Have a Feature Request?
[Open a Discussion](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/discussions)

### 🤔 Questions?
- Check the [README](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling#readme)
- Search [existing issues](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/issues)
- Ask on [Trailblazer Community](https://trailblazer.salesforce.com/)

---

## Reopen This Walkthrough

You can always return to this guide:
1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **B2C DX: Open Getting Started Guide**

---

**Happy Coding!** 🚀
