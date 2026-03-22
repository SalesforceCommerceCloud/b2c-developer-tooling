---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': minor
---

Add `cap` command topic for Commerce App Package (CAP) management.

New commands:
- `b2c cap validate` — validates CAP structure, manifest, and cartridge rules locally
- `b2c cap package` — packages a CAP directory into a distributable `.zip`
- `b2c cap install` — installs a CAP on an instance via WebDAV + `sfcc-install-commerce-app` job
- `b2c cap uninstall` — uninstalls a CAP via `sfcc-uninstall-commerce-app` job

New SDK exports in `@salesforce/b2c-tooling-sdk/operations/cap`: `validateCap`, `commerceAppInstall`, `commerceAppUninstall`, `commerceAppPackage`.

The VS Code extension gains CAP directory detection (badge decoration) and an "Install Commerce App (CAP)" context menu action.
