---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-docs': patch
---

Add `cap list`, `cap tasks`, and `cap pull` commands for managing installed Commerce Apps

- `cap list` exports and parses `commerce_feature_states` to show installed features with type, source, status, and version
- `cap tasks` displays configuration tasks for an installed app with clickable Business Manager links
- `cap pull` downloads and extracts installed app source packages for cartridge deployment or Storefront Next development
- Standardize all cap commands to use `--site-id` flag (with `--site` as alias)
- `cap uninstall` no longer requires `--domain` — looks it up automatically from the feature state
- `cap install` now keeps the archive on the instance by default (use `--clean-archive` to remove)
