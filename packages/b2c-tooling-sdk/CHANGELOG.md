# @salesforce/b2c-tooling-sdk

## 0.11.0

### Minor Changes

- [#278](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/278) [`8c31081`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c31081b47e57e6a21e62425e6f19da036fc3e34) - Add `content validate` command to validate Page Designer metadefinition JSON files against bundled schemas. Supports auto-detection of schema types from file paths and content, or explicit `--type` flag. Includes glob pattern support for validating multiple files. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#274](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/274) [`e4b5094`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e4b5094d9c1c2a60e1214bc236ce7ed84c5d158b) - Replace `archiver` with `tar-fs` for MRT bundle creation, removing deprecated `glob@10.5.0` from the production dependency tree (Thanks [@clavery](https://github.com/clavery)!)

## 0.10.0

### Minor Changes

- [#167](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/167) [`caa568e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/caa568e9de3e8c9d3f2e7b17e5f96c1a0ae3ca73) - Introduces stateful authentication: `auth login` (browser/implicit), `auth logout`, `auth client` (client_credentials/password), `auth client renew`, and `auth client token`. Sessions are stored as a JSON file in the CLI data directory; when a valid session exists, all OAuth commands use it automatically without requiring credentials on every invocation. (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

  **Note:** Sessions are not shared with `sfcc-ci`. Re-authenticate with `b2c auth login` or `b2c auth client` after upgrading. Existing stateless auth (env vars, `dw.json`) is unaffected.

### Patch Changes

- [`b30e427`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b30e427f25807840dbcceef6c0005e2d9fd1be53) - Add `--path` flag to `b2c docs schema` to print the filesystem path to a schema file instead of its content, enabling use with tools like `xmllint` for XML validation. (Thanks [@clavery](https://github.com/clavery)!)

- [#272](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/272) [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc) - Added sfcc-ci migration guide with command mappings and CI/CD migration instructions. Added backward-compatible sfcc-ci command aliases (`client:auth`, `code:deploy`, `code:list`, `code:activate`, `job:run`, etc.) and environment variable aliases (`SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET`, `SFCC_LOGIN_URL`). (Thanks [@clavery](https://github.com/clavery)!)

## 0.9.0

### Minor Changes

- [#263](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/263) [`16bd9d6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/16bd9d6a1c658d6ba3de04fa3acf89295e1e5e06) - `resolveConfig()` and the `ConfigSource` interface are now async. This enables config sources that perform async I/O such as keychain lookups, credential vaults, or network-based config stores. (Thanks [@clavery](https://github.com/clavery)!)

  **Breaking:** `resolveConfig()` now returns `Promise<ResolvedB2CConfig>` — callers must `await` the result. The `ConfigSource.load()` method return type is now `MaybePromise<ConfigLoadResult | undefined>`, so existing sync source implementations continue to work without changes.

### Patch Changes

- [`4cf7249`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/4cf72497f5e01d627de7aae80290d072f4c914f6) - Add `cartridges` config option to specify which cartridges to deploy/watch. Supports comma or colon-separated strings, or arrays in dw.json. Also accepts `cartridgesPath` as an alias. The `-c` flag still takes precedence when provided. (Thanks [@clavery](https://github.com/clavery)!)

- [#264](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/264) [`9996eba`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/9996eba2a8fe53a27bf52fb208eb722d618cd282) - Fix multiple issues with the hook scaffold (#247): (Thanks [@clavery](https://github.com/clavery)!)

- [#262](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/262) [`d50bf6b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d50bf6b91dcd40314f10c8c97a28805039161213) - Replace @salesforce/telemetry with direct applicationinsights dependency to eliminate the punycode deprecation warning on Node 21+ (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.3

### Patch Changes

- [`760a6cb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/760a6cbe144ffcd7c72b32b05df861626d3d5a2c) - Strip `development` export conditions from package.json during publish. Fixes `MODULE_NOT_FOUND` errors when plugins or consumers install the SDK from npm, where the `src/` directory is not included. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.2

### Patch Changes

- [`d4423bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d4423bb218af3991396286b4900c3b051666e06b) - Add MRT environment variable support to EnvSource (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN` and their `SFCC_MRT_*` variants). The `setup inspect` command now shows values from SFCC\_\* environment variables as a config source. (Thanks [@clavery](https://github.com/clavery)!)

- [`69a98dc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/69a98dc21f3a326f551929fcd530741b9f0ca126) - Fix `--server` override dropping config from non-instance-bound sources. Previously, overriding the server hostname discarded all config values including credentials from global sources like config plugins. Now only values from the source that provided the conflicting hostname are dropped. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.1

### Patch Changes

- [#249](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/249) [`e790dfa`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e790dfa8d5375fde7936ae4a10b2f3fd722ec087) - Add `--wait` flag to `sandbox clone create` command to poll until the clone completes, matching the behavior of `sandbox create --wait`. Also fixes the status check hint to display the correct command name instead of a raw template string. (Thanks [@clavery](https://github.com/clavery)!)

## 0.8.0

### Minor Changes

- [#244](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/244) [`b26ebeb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b26ebebd2b5dbff19689bdfadd5b9864597fbfb1) - Add API Browser with Swagger UI for interactive SCAPI exploration. Proxy requests through extension host to avoid CORS, pre-fill parameters and auth tokens, and expand custom properties in schemas. (Thanks [@clavery](https://github.com/clavery)!)

## 0.7.0

### Minor Changes

- [#241](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/241) [`3758114`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3758114c328fcfffc54fb32a935df23503fc0ba2) - Add `EnvSource` config source that maps `SFCC_*` environment variables to config fields (Thanks [@clavery](https://github.com/clavery)!)

- [#232](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/232) [`732d4ad`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/732d4ad1e52dd1e0f0676cee87305464ccf4ca9e) - Add `slas token` command to retrieve SLAS shopper access tokens for API testing. Supports public (PKCE) and private (client_credentials) client flows, guest and registered customer authentication, and auto-discovery of public SLAS clients. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [`1b9b477`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1b9b4773110a5d97bfe81d37a093158088d94cee) - Fix `b2c setup skills` serving stale cached skills when downloading latest release (Thanks [@clavery](https://github.com/clavery)!)

## 0.6.0

### Minor Changes

- [#230](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/230) [`8faf831`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8faf831b4e4827e252e48242b2a2b2155157f3c2) - Add `detectSourceFromPath()` for context-aware scaffold parameter detection, `cartridgePathForDestination()` export, and `builtInScaffoldsDir` option on `createScaffoldRegistry()` for bundled consumers (Thanks [@clavery](https://github.com/clavery)!)

## 0.5.5

### Patch Changes

- [`beaf275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/beaf275efbe36b2c5f33c7ed9e368e24f48022fc) - MRT environment variables now use non-prefixed names (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN`) as primary. The `SFCC_`-prefixed versions continue to work as fallbacks. (Thanks [@clavery](https://github.com/clavery)!)

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
