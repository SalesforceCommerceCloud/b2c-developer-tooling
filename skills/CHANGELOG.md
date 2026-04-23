# @salesforce/b2c-agent-plugins

## 1.1.3

### Patch Changes

- [`485ef63`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/485ef63b901d91f7b08c56366d1f1756a03f60dc) - Fix skills artifact download by publishing zip assets to dedicated agent-plugins releases (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.2

### Patch Changes

- [`453f9e1`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/453f9e18a328807c631ded9be94d6db47044f06c) - Add Commerce Apps Dev (cap-dev) skill set to Claude Code and Codex marketplace configurations (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.1

### Patch Changes

- [`bad9034`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bad903469353654a4b3cdbafecf2cbce5a863ea1) - Improved CAP skill with better guidance and UX refinements (Thanks [@clavery](https://github.com/clavery)!)

## 1.1.0

### Minor Changes

- [#365](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/365) [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859) - Initial release. This package tracks the version of the B2C Commerce agent skills plugins (`b2c-cli` and `b2c`). Its version is stamped into the Claude Code marketplace entries and the Codex plugin manifests at release time, and skills-only changes get a dedicated `b2c-agent-plugins@X.Y.Z` GitHub release tag with updated skills zips attached. Target this package in a changeset when you change skills under `skills/b2c-cli/skills/` or `skills/b2c/skills/`. (Thanks [@clavery](https://github.com/clavery)!)
