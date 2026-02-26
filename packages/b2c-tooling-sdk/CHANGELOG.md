# @salesforce/b2c-tooling-sdk

## 0.5.4

### Patch Changes

- [`f9ebb56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9ebb562d0c894aed9f0498b78ca01fce70db352) - Fix duplicate config source registration in `ConfigSourceRegistry` when multiple discovery paths find the same plugins (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.3

### Patch Changes

- [#206](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/206) [`eff87af`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eff87afec464a25b66f958a22984d92865a9aee4) - Add `globalConfigSourceRegistry` for automatic plugin config source inclusion in `resolveConfig()`, matching the existing middleware registry pattern. Plugin config sources are now picked up automatically by all SDK consumers without manual plumbing. Also improves test isolation by preventing locally installed plugins from affecting test runs. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.2

### Patch Changes

- [`a9db7da`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a9db7daf60a9071244c8e2e098dbd4f8fc58495d) - Add legacy env var fallbacks for MRT flags: `MRT_PROJECT` for --project and `MRT_TARGET` for --environment (Thanks [@clavery](https://github.com/clavery)!)

- [#186](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/186) [`dc7a25a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/dc7a25aedef047190250b696421e4a25c00cba15) - Add `@salesforce/b2c-tooling-sdk/plugins` module for discovering and loading b2c-cli plugins outside of oclif. Enables the VS Code extension and other non-CLI consumers to use installed plugins (keychain managers, config sources, middleware) without depending on `@oclif/core`. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.1

### Patch Changes

- [#199](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/199) [`eb3f5d0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eb3f5d05392344b21572e1ec61f35fa6af08d542) - Rename `--working-directory` flag to `--project-directory`. The old flag name `--working-directory` is still accepted as an alias. Primary env var is now `SFCC_PROJECT_DIRECTORY`; `SFCC_WORKING_DIRECTORY` continues to work as a deprecated fallback. (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.0

### Minor Changes

- [#155](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/155) [`55c81c3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/55c81c3b3cdd8b85edfe5eb0070e28a96752ac83) - Add a new `cip` command topic for Commerce Intelligence platform (CCAC - Commerce Cloud Analytics) with `cip query` for raw SQL and curated `cip report <report-name>` subcommands for analytics workflows, including CIP host override support and tenant-based CIP instance targeting. (Thanks [@clavery](https://github.com/clavery)!)

- [#163](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/163) [`87321c0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/87321c0051c171d35ca53760d4cffa3f9ebe406c) - `--json` no longer switches log output to JSONL. Logs are always human-readable on stderr; `--json` only controls the structured result on stdout. Use the new `--jsonl` flag (or `SFCC_JSON_LOGS` env var) to get machine-readable log lines. (Thanks [@clavery](https://github.com/clavery)!)

- [#133](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/133) [`1485923`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1485923581c6f1cb01c48a2e560e369843952020) - # Add new MCP tools (Thanks [@yhsieh1](https://github.com/yhsieh1)!)
  - `scapi-schemas-list`: List and fetch SCAPI schemas (standard and custom)
  - `scapi-custom-apis-status`: Check custom API endpoint registration status
  - `mrt_bundle_push`: Push and deploy a pre-built Storefront Next PWA Kit project to Managed Runtime
  - `cartridge_deploy`: Find and deploy cartridges to a B2C Commerce instance via WebDAV
  - `storefront_next_development_guidelines`: Get critical architecture rules, coding standards, and best practices for Storefront Next development

### Patch Changes

- [#181](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/181) [`556f916`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/556f916f74c43373c0da125af1b53721b2c193ec) - Fix `--no-download` flag on `job export` to actually skip downloading the archive from the instance (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.1

### Patch Changes

- [#143](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/143) [`ca9dcf0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca9dcf0e9242dce408cf0c8e9cf1920d5ad40157) - Fix AM role ID mapping between API internal/external formats and improve user display output. Role grant/revoke now correctly handle mixed formats (role IDs in roles array, enum names in roleTenantFilter). User display shows role descriptions, resolves org names, and detects auth errors with actionable --user-auth suggestions. Commands accepting org IDs now also accept friendly org names. (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.0

### Minor Changes

- [#117](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/117) [`59fe546`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/59fe54612e35530ccb000e0b16afba5c62eed429) - Add `content export` and `content list` commands for exporting Page Designer pages with components and static assets from content libraries. Supports filtering by page ID (exact or regex), folder classification, offline mode, and dry-run preview. (Thanks [@clavery](https://github.com/clavery)!)

- [`44b67f0`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/44b67f00ded0ab3a458f91f55b00b7106fb371be) - Embed a default public client ID for implicit OAuth flows. Account Manager, Sandbox, and SLAS commands now work without requiring a pre-configured client ID — the CLI will automatically use a built-in public client for browser-based authentication. (Thanks [@clavery](https://github.com/clavery)!)

- [#98](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/98) [`91593f2`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/91593f28cb25b9a466c6ef0db1504b39f3590c7a) - Add `setup instance` commands for managing B2C Commerce instance configurations (create, list, remove, set-active). (Thanks [@clavery](https://github.com/clavery)!)

- [#125](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/125) [`0d29262`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/0d292625f4238fef9fb1ca530ab370fdc6e190d8) - Add `mrt tail-logs` command to stream real-time application logs from Managed Runtime environments. Supports level filtering, regex search with match highlighting, and JSON output. (Thanks [@clavery](https://github.com/clavery)!)

- [#112](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/112) [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81) - Accept both camelCase and kebab-case for all field names in dw.json and package.json `b2c` config. For example, `clientId` and `client-id` are now equivalent everywhere. Legacy aliases like `server`, `passphrase`, and `selfsigned` continue to work. (Thanks [@clavery](https://github.com/clavery)!)

- [#102](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/102) [`8592727`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/859272776afa5a9d6b94f96b13de97a7af9814eb) - Add scaffolding framework for generating B2C Commerce components from templates. Includes 7 built-in scaffolds (cartridge, controller, hook, service, custom-api, job-step, page-designer-component) and support for custom project/user scaffolds. SDK provides programmatic API for IDE integrations and MCP servers. (Thanks [@clavery](https://github.com/clavery)!)

- [#120](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/120) [`908be47`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/908be47541f5d3d88b209f69ede488c9464606cb) - Add `--user-auth` flag for simplified browser-based authentication. AM commands now use standard auth method order; enhanced error messages provide role-specific guidance for Account Manager operations. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#63](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/63) [`1a3117c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1a3117c42211e4db6629928d1f8a58395a0cadc7) - Account Manager (AM) topic with `users`, `roles`, and `orgs` subtopics. Use `b2c am users`, `b2c am roles`, and `b2c am orgs` for user, role, and organization management. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

- [#103](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/103) [`7a3015f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7a3015f05183ad09c55e20dfe64ce7f3b8f1ca50) - Add automatic 401 retry with token refresh to openapi-fetch middleware. This ensures API clients (OCAPI, SLAS, SCAPI, etc.) automatically refresh expired tokens during long-running operations. (Thanks [@clavery](https://github.com/clavery)!)

- [#112](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/112) [`33dbd2f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/33dbd2fc1f4d27e94572e36505088007ebe77b81) - Support `sandbox-api-host` in dw.json and other config sources (previously only worked as a CLI flag or environment variable) (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.0

### Minor Changes

- [#83](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/83) [`ddee52e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ddee52e2c61991dbcc4d3aeed00ee802530a0e7c) Thanks [@clavery](https://github.com/clavery)! - Add support for realm-instance format in ODS commands. You can now use `zzzv-123` or `zzzv_123` instead of full UUIDs for `ods get`, `ods start`, `ods stop`, `ods restart`, and `ods delete` commands.

- [#77](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/77) [`6859880`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6859880195d2da4cd6363451c79224878917abb7) Thanks [@clavery](https://github.com/clavery)! - Add log tailing, listing, and retrieval commands for viewing B2C Commerce instance logs. See `b2c logs` topic.

- [#85](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/85) [`6b89ed6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6b89ed622a1f59e91cfd6dad643a5e834d8d7470) Thanks [@clavery](https://github.com/clavery)! - Surface config source errors as warnings. When a config source (like dw.json) has malformed content, the error is now displayed as a warning instead of being silently ignored.

- [#94](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/94) [`c34103b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c34103b594dee29198de3ae6fe0077ff12cd3f93) Thanks [@clavery](https://github.com/clavery)! - Add two-factor client certificate (mTLS) support for WebDAV operations

## 0.2.1

### Patch Changes

- [`4e90f16`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4e90f161f8456ff89c4e99522ae83ae6a7352a44) Thanks [@clavery](https://github.com/clavery)! - dw.json format bug fix

## 0.2.0

### Minor Changes

- [#59](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/59) [`253c1e9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/253c1e99dbb0962e084d644c620cc2ec019f8570) Thanks [@clavery](https://github.com/clavery)! - Adds complete MRT CLI coverage organized by scope: `mrt project` (CRUD, members, notifications), `mrt env` (CRUD, variables, redirects, access-control, cache invalidation, B2C connections), `mrt bundle` (deploy, list, history, download), `mrt org` (list, B2C instances), and `mrt user` (profile, API key, email preferences).

- [`e0d652a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e0d652ae43ba6e348e48702d77643523dde23b26) Thanks [@clavery](https://github.com/clavery)! - Add `b2c setup skills` command for installing agent skills to AI-powered IDEs (Claude Code, Cursor, Windsurf, VS Code/Copilot, Codex, OpenCode)

- [`11a6887`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/11a68876b5f6d1d8274b118a1b28b66ba8bcf1a2) Thanks [@clavery](https://github.com/clavery)! - Add `b2c ecdn` commands for managing eCDN zones, certificates, WAF, caching, security settings, and related configurations.

- [#66](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/66) [`a14c741`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a14c7419b99f3185002f8c7f63565ed8bc2eea90) Thanks [@clavery](https://github.com/clavery)! - Add User-Agent header to all HTTP requests. Sets both `User-Agent` and `sfdc_user_agent` headers with the SDK or CLI version (e.g., `b2c-cli/0.1.0` or `b2c-tooling-sdk/0.1.0`).

### Patch Changes

- [#64](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/64) [`c35f3a7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c35f3a78c4087a8a133fe2d013c7c61b656a4a34) Thanks [@clavery](https://github.com/clavery)! - Fix HTML response bodies appearing in ERROR log lines. When API requests fail with non-JSON responses (like HTML error pages), error messages now show the HTTP status code (e.g., "HTTP 521 Web Server Is Down") instead of serializing the entire response body.

  Added `getApiErrorMessage(error, response)` utility that extracts clean error messages from ODS, OCAPI, and SCAPI error patterns with HTTP status fallback.

## 0.1.0

### Minor Changes

- [`bf0b8bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf0b8bb4d2825f5e0dc85eb0dac723e5a3fde73a) Thanks [@clavery](https://github.com/clavery)! - Initial developer preview release
