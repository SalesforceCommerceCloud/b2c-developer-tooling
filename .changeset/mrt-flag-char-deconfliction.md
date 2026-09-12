---
'@salesforce/b2c-cli': major
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

De-conflict short flags on the `mrt` command surface so each `-x` means one thing:

- `--cloud-origin` moved from `-o` to `-u`, freeing `-o` for `--organization` (`mrt project create` / `list`) and `--output` (`mrt bundle download`) — which previously shadowed the base flag. **Breaking:** update any scripts passing `-o` for the cloud origin; the long form `--cloud-origin` is unchanged.
- `mrt project notification create` / `update`: `--target` (the notification's target-environment list) now also accepts `--environment` / `-e` as aliases, since a notification target _is_ an environment. These two commands no longer expose the standalone single-value `--environment` flag — it was unused there and its `--target` alias collided with the command's own `--target`.
