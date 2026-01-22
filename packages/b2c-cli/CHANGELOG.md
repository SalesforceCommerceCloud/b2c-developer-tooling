# @salesforce/b2c-cli

## 0.2.0

### Minor Changes

- [#62](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/62) [`269de20`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/269de20e7f90fc684818bab805d612f7a77f5838) Thanks [@clavery](https://github.com/clavery)! - Add `setup config` command to display resolved configuration with source tracking.

  Shows all configuration values organized by category (Instance, Authentication, SCAPI, MRT) and indicates which source file or environment variable provided each value. Sensitive values are masked by default; use `--unmask` to reveal them.

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Reorganizes MRT commands by scope: project-level commands under `mrt project`, environment-level under `mrt env`, and deployment commands under `mrt bundle`. The `mrt bundle download` command now downloads files by default instead of just printing the URL.

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Adds complete MRT CLI coverage organized by scope: `mrt project` (CRUD, members, notifications), `mrt env` (CRUD, variables, redirects, access-control, cache invalidation, B2C connections), `mrt bundle` (deploy, list, history, download), `mrt org` (list, B2C instances), and `mrt user` (profile, API key, email preferences).

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Replaces `mrt push` with `mrt bundle deploy`. The new command supports both pushing local builds and deploying existing bundles by ID.

- [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26) Thanks [@clavery](https://github.com/clavery)! - Add `b2c setup skills` command for installing agent skills to AI-powered IDEs (Claude Code, Cursor, Windsurf, VS Code/Copilot, Codex, OpenCode)

- [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2) Thanks [@clavery](https://github.com/clavery)! - Add `b2c ecdn` commands for managing eCDN zones, certificates, WAF, caching, security settings, and related configurations.

### Patch Changes

- [`97f4b68`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/97f4b68be15dedeff0fe91782f97a5eeddb7b36c) Thanks [@clavery](https://github.com/clavery)! - code deploy archive deletion is not a hard error

- [#64](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/64) [`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34) Thanks [@clavery](https://github.com/clavery)! - Fix HTML response bodies appearing in ERROR log lines. When API requests fail with non-JSON responses (like HTML error pages), error messages now show the HTTP status code (e.g., "HTTP 521 Web Server Is Down") instead of serializing the entire response body.

  Added `getApiErrorMessage(error, response)` utility that extracts clean error messages from ODS, OCAPI, and SCAPI error patterns with HTTP status fallback.

- Updated dependencies [[`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34), [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570), [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26), [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2), [`a14c741`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a14c7419b99f3185002f8c7f63565ed8bc2eea90)]:
  - @salesforce/b2c-tooling-sdk@0.2.0

## 0.1.0

### Minor Changes

- [`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a) Thanks [@clavery](https://github.com/clavery)! - Initial developer preview release

### Patch Changes

- Updated dependencies [[`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a)]:
  - @salesforce/b2c-tooling-sdk@0.1.0
