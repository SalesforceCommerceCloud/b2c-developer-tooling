# @salesforce/b2c-dx-docs

## 0.3.6

### Patch Changes

- [#492](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/492) [`5af7cae`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5af7caeb66c78196fad647b51dbdb184b8bee844) - Removed pilot note for Storefront Next (Thanks [@knhage](https://github.com/knhage)!)

- [`19f059e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/19f059e7ba928d1070d7960920770f1256dfae73) - Document the new `storefront-next-figma` plugin in the Agent Skills guide, the install snippets (homepage, setup), and the Figma tools setup page. The plugin requires the [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) and can be installed from the plugin marketplace or with `b2c setup skills storefront-next-figma`. (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.5

### Patch Changes

- [`39dc19d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/39dc19d5c91ea537b18fd57ef8373250b74a3b83) - Document the `storefront-next` and `b2c-dx-mcp` plugins in the homepage and Agent Skills install snippets, and note that `b2c-dx-mcp` installs the MCP server. Removed the agent-facing "When to use which tool" sections from the MCP log and docs tool reference pages. (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.4

### Patch Changes

- [#473](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/473) [`b723939`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b72393951bb95b64f3291cd3cb76197e280a6a37) - Documentation audit and repair pass: corrected stale CLI flag and command references across the CLI reference and guides, fixed broken examples (e.g. eCDN mTLS, sandbox `--no-*` flags, WebDAV `get` arguments), aligned SDK JSDoc with current signatures, and added the missing `operations/cap` typedoc entry point so the Commerce App SDK module appears in the API reference. Filled in JSDoc for previously undocumented public exports across the SDK (auth, clients, instance, logging, ods, mrt, cap, cip, debug, scaffold, schemas, skills, etc.) so the generated API docs cover the full public surface. (Thanks [@clavery](https://github.com/clavery)!)

- [#478](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/478) [`d19802f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/d19802f26b5e1c0a609a2a27daa60dd1763b6786) - Document the GitHub Actions install behavior change. The high-level actions (`code-deploy`, `data-import`, `job-run`, `mrt-deploy`, `webdav-upload`) now reuse an already-installed CLI and install one only when none is present — so a deploy that follows a setup step, and repeated operations on a persistent self-hosted runner, no longer trigger a redundant reinstall or an unexpected upgrade. The `setup` action called directly still installs the version you request (a new `skip-if-present` input opts into reuse). The actions no longer cache the npm download directory, which had grown to gigabytes on long-lived self-hosted runners and slowed restores. Plugin installs are skipped by exact name match. (Thanks [@clavery](https://github.com/clavery)!)

- [#431](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/431) [`80d594f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/80d594f741b6eb9c8ac76a4bb954403518497478) - Document deploying to staging environments (two-factor mTLS) from CI/CD. The `setup` GitHub Action now accepts `webdav-server`, `certificate`, `certificate-passphrase`, and `selfsigned` inputs so workflows can target staging instances that require a separate WebDAV hostname and a client certificate. The CI/CD guide includes a full GitHub Actions example using a base64-encoded `.p12` secret. (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.3

### Patch Changes

- [`b8dcf74`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b8dcf741c253fee0df4219400bfa10a79c704e98) - Document Cursor as a first-class skills target, including its compatibility with Claude Code and Codex skill paths so plugins installed via `claude plugin install` are auto-picked-up by Cursor. (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.2

### Patch Changes

- [`a670cc7`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a670cc7c00e1ba5ee0057de7c1152bb57396c6fc) - Add page-specific SEO meta descriptions to the SCAPI Schemas CLI reference and CI/CD guide pages, replacing the site-wide default description. (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.1

### Patch Changes

- [#409](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/409) [`ec31234`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ec312342e14080fb5d51b72243e763030c429f80) - Document the B2C DX VS Code Extension. New `/vscode-extension/` section with overview, installation (with a dynamic download link to the latest VSIX release), configuration reference, and a feature tour covering Sandbox Realm Explorer, Cartridge Code Sync, WebDAV Browser, Content Libraries, SCAPI API Browser, B2C Script Debugger, scaffold/CAP install, log tailing, and B2C CLI plugin support. (Thanks [@clavery](https://github.com/clavery)!)

## 0.3.0

### Minor Changes

- [#408](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/408) [`a26226c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a26226c8d755bc3d93462418cb94ddc0f1083a29) - Replaced the BM Roles docs page with a comprehensive Business Manager reference covering all `b2c bm` commands — `bm roles` (list/get/create/delete/grant/revoke + permissions), `bm users` (list/get/search/update/delete), `bm whoami`, and `bm access-key` (get/create/set/delete). The new page documents the user-auth requirement on whoami and access-key endpoints, the access-key scope enum, and common workflows like rotating your own WebDAV password. (Thanks [@clavery](https://github.com/clavery)!)

### Patch Changes

- [#395](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/395) [`b947888`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b947888ed07073ae2c4c79fe9cc00bd893b81bbe) - Add debug command documentation and b2c-debug agent skill covering interactive REPL, RPC mode, and DAP usage. (Thanks [@clavery](https://github.com/clavery)!)

- [`3cefda3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3cefda324bce7a22183245162303df236f70be7d) - Documentation audit pass: corrected mismatched flags and missing commands across the CLI reference. Highlights: (Thanks [@clavery](https://github.com/clavery)!)
  - Documented `b2c sandbox ips`, `b2c mrt env var push`, and `b2c debug` (previously omitted).
  - Fixed `mrt project get/update/delete` examples to use the required positional slug; corrected `mrt project member add/update --role` to integer values; replaced `mrt env invalidate --path` with the actual `--pattern` flag; corrected `mrt env redirect create/delete/clone` flag names; rewrote `mrt user api-key` and `mrt user email-prefs` against the real flags.
  - Rewrote `ecdn zones create`, `ecdn cache purge`, `ecdn security update`, `ecdn speed update`, and `ecdn logpush jobs create` flag tables to match source.
  - Removed phantom flags (`--display-name`, etc.) from `am users update`.
  - Standardized Node.js requirement on `>=22.16.0` across all installation guides.
  - `account-manager` guide no longer recommends the unsupported `client_secret_post`; the `authentication` warning was reframed as guidance toward `client_secret_basic`.
  - Added a Copilot section to the agent-skills guide so the homepage Copilot link points at meaningful content.
  - Filled gaps in the CLI command-topic index (`bm-roles`, `setup`, `ecdn`, `replications`, `scapi-schemas`, `cap`, `logs`).

- [#389](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/389) [`23205eb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/23205eb77443a64c46e61de8ead2b40c6469a97d) - Updated plugin install examples to default to user scope (Thanks [@amit-kumar8-sf](https://github.com/amit-kumar8-sf)!)

- [#328](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/328) [`31e136b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/31e136b2cd3affd6ecfb53c949aa4374c82561ad) - ODS CLI: **`b2c sandbox create`** adds **`--emails`** for notification addresses; **`b2c sandbox update`** adds **`--start-scheduler`**, **`--stop-scheduler`**, **`--clear-start-scheduler`**, and **`--clear-stop-scheduler`**; **`b2c realm update`** adds **`--emails`**, **`--start-scheduler`**, **`--stop-scheduler`**, **`--clear-start-scheduler`**, and **`--clear-stop-scheduler`**. (Thanks [@charithaT07](https://github.com/charithaT07)!)

  Sandbox API: **`b2c sandbox operations list`** and **`b2c sandbox operations get`** (inspect lifecycle operations); **`b2c sandbox alias get`** (get one alias by ID, same endpoint as **`alias list --alias-id`**).

  User guide updated for scheduling flags, sandbox operations, and **`b2c sandbox alias get`**.

## 0.2.22

### Patch Changes

- [`ca921ae`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ca921ae7b890902a0e00d6cdbff562aa78723889) - Add tip for updating Copilot skills marketplace in VS Code via Check for Extension Updates (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.21

### Patch Changes

- [`70ccffb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/70ccffbbe22df80f536edbb935847c76463a42af) - Add rename notice to homepage explaining B2C DX is now the Agentic B2C Developer Toolkit (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.20

### Patch Changes

- [`21e0c4e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/21e0c4e57ab16361445e07374707c6c988f6953a) - Rebrand docs homepage and intro pages to "Agentic B2C Developer Toolkit" (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.19

### Patch Changes

- [`3ffd72d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/3ffd72d6c43f2ac812559e7ea22de3206cf6df9d) - Update agent skills guide and CLI setup reference for storefront-next plugin (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.18

### Patch Changes

- [`c5edd5d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c5edd5dccc5e472528c08c3fb2fc12b1872440c6) - Updated plugin install examples to default to user scope (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.17

### Patch Changes

- [#370](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/370) [`ee735bb`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ee735bb0acac89999114c80679b4766216bf463a) - Add `cap list`, `cap tasks`, and `cap pull` commands for managing installed Commerce Apps (Thanks [@clavery](https://github.com/clavery)!)
  - `cap list` exports and parses `commerce_feature_states` to show installed features with type, source, status, and version
  - `cap tasks` displays configuration tasks for an installed app with clickable Business Manager links
  - `cap pull` downloads and extracts installed app source packages for cartridge deployment or Storefront Next development
  - Standardize all cap commands to use `--site-id` flag (with `--site` as alias)
  - `cap uninstall` no longer requires `--domain` — looks it up automatically from the feature state
  - `cap install` now keeps the archive on the instance by default (use `--clean-archive` to remove)

- [`db5648f`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/db5648ff2a119a3e3b0ad165905eb8cc322d964b) - Improved release workflow reliability (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.16

### Patch Changes

- [`396dbc9`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/396dbc98330a7b2112f2a13330e3008fa4bbbb00) - Verify release workflow with PAT-triggered checks and release label (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.15

### Patch Changes

- [#365](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/365) [`c4309db`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c4309db94c8c61b25692775557c6c9ab0f627859) - Broaden skills-plugin install support and improve the installation docs. (Thanks [@clavery](https://github.com/clavery)!)
  - Add a Codex plugin marketplace so the three plugins (`b2c-cli`, `b2c`, `b2c-dx-mcp`) can be installed directly from Codex CLI's plugin directory.
  - Add a new `b2c-onboarding` skill (in the `b2c` plugin) that walks new developers through CLI verify, `dw.json` setup, sandbox connect, and first cartridge deploy, then hands off to the topic-specific skill for the user's goal.
  - Add per-plugin READMEs with install instructions for each supported client.
  - Document Copilot CLI + VS Code Copilot install paths and the Codex marketplace install path.
  - Remove the `b2c-experimental` plugin from the public marketplace.

- [#363](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/363) [`e79e275`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e79e27502be7fdada7680a81a3c3b46e115c6f39) - Upgrade documentation site to VitePress 2.0.0-alpha. Adds package-manager (Thanks [@clavery](https://github.com/clavery)!)
  icons in `::: code-group` tabs (npm, pnpm, yarn, Homebrew), "Edit this page
  on GitHub" links, git-based "Last updated" timestamps, and improved local
  search ranking. Generated SDK API pages under `/api/` have edit and
  last-updated UI suppressed since they are regenerated on every build.

## 0.2.14

### Patch Changes

- [`18f8d5c`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/18f8d5cc7cc4b5ab982a0ef8d4638f0a5728b86d) - Updated Agentforce Vibes skills documentation with correct link and autodetect example. (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.13

### Patch Changes

- [#318](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/318) [`6880a84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6880a846aacd029a1eb510023aa76f4b844ec26e) - Added per-instance safety configuration with rule-based actions (allow/block/confirm) and interactive confirmation mode. Safety can now be configured in `dw.json` with granular rules for HTTP paths, job IDs, and CLI commands. (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.12

### Patch Changes

- [#305](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/305) [`7ad490a`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ad490a508b7f993292bd8a326f7a6c49c92d70c) - Add `--wait` flag to `mrt bundle deploy` to poll until deployment completes, and align all SDK wait functions (`waitForJob`, `waitForEnv`) to a consistent pattern with structured `onPoll` callbacks, seconds-based options, and injectable `sleep` for testing. (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.11

### Patch Changes

- [#293](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/293) [`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e) - Add Business Manager role management commands (`bm roles`) for instance-level access role CRUD, user assignment, and permissions via OCAPI Data API (Thanks [@clavery](https://github.com/clavery)!)

- [#286](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/286) [`5a6ab56`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/5a6ab56a2842065b7f1815539bc5a70911826e9c) - Add `mrt save-credentials` command to save MRT API credentials to the ~/.mobify file (Thanks [@clavery](https://github.com/clavery)!)

- [#293](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/293) [`b5d07fd`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b5d07fd1d1086ee92b735d73502997bcad97dc7e) - Add SDK migration tutorial for sfcc-ci programmatic API users (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.10

### Patch Changes

- [#289](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/289) [`7287490`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7287490d6ec4e3597822d0ee0e4d6775ae656845) - Document MCP server GA availability updates. CARTRIDGES, MRT, SCAPI, and PWAV3 tools are generally available and no longer require `--allow-non-ga-tools`; STOREFRONTNEXT tools remain in preview. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.9

### Patch Changes

- [#287](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/287) [`a98d28d`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a98d28d83c40da5ab2d6c1389b5aa7e290921473) - Clarified MCP documentation for quick install and configuration, including project-root setup steps, environment variable guidance, and MRT/theming tool setup details to reduce onboarding confusion. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.8

### Patch Changes

- [#280](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/280) [`a58dd74`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/a58dd7437d133e6509946f7a73246a96f61f0673) - Refreshed the MCP and agent-skill documentation with clearer installation and configuration guidance, plus updated skill catalog references. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.7

### Patch Changes

- [#272](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/272) [`e919e50`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/e919e502a7a0a6102c4039d003da0d90ab3673dc) - Added sfcc-ci migration guide with command mappings and CI/CD migration instructions. Added backward-compatible sfcc-ci command aliases (`client:auth`, `code:deploy`, `code:list`, `code:activate`, `job:run`, etc.) and environment variable aliases (`SFCC_OAUTH_CLIENT_ID`, `SFCC_OAUTH_CLIENT_SECRET`, `SFCC_LOGIN_URL`). (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.6

### Patch Changes

- [#270](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/270) [`bf35222`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bf352223881dccba4ba07c62bdf4d50a2832c835) - Rename MCP tools for clearer, action-oriented naming. scapi_custom_api_scaffold → scapi_custom_api_generate_scaffold. sfnext_map_tokens_to_theme → sfnext_match_tokens_to_theme. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.5

### Patch Changes

- [#253](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/253) [`1147ea3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/1147ea300b8faca02136d03900f734c73f002f16) - Improved MCP documentation: added `@latest` to all examples to prevent Windows caching issues, standardized server name to `b2c-dx-mcp`, updated GitHub Copilot examples to use correct `servers` format with `type: stdio`, clarified MRT configuration options (`mrtProject`, `mrtEnvironment`, `mrtApiKey` in dw.json vs `api_key` in ~/.mobify), changed "Claude Desktop" to "Claude Code" throughout, simplified authentication sections, and improved flag documentation consistency across tool pages. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.4

### Patch Changes

- [#239](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/239) [`18ea049`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/18ea04990e24de4de2071cb5502e002c6086327d) - Add early access notices to Storefront Next MCP tool documentation indicating they're part of a closed pilot. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.3

### Patch Changes

- [#236](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/236) [`113e81e`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/113e81e148e1c93bfa09a7d2223b0eeed6a3f41e) - Improved MCP documentation: fixed broken links, promoted project-level installation for Claude Code and Cursor, simplified verbose sections, and verified all configuration details match implementation. (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.2

### Patch Changes

- [#226](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/226) [`8c6665b`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/8c6665ba8a51ddf1d572b9fbff66b9685699880e) - MCP MRT Push now uses correct defaults based on detected project type (Thanks [@patricksullivansf](https://github.com/patricksullivansf)!)

- [#229](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/229) [`b893aa8`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b893aa883b3670e6248e772705e4b303b2c383b6) - Reorganize documentation navigation into Guides, Reference, and SDK sections for clearer information architecture (Thanks [@clavery](https://github.com/clavery)!)

## 0.2.1

### Patch Changes

- [#202](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/202) [`917c230`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/917c230d033b7b12bd0262d221173618f71cd0a7) - MCP docs: preview release wording, sidebar nav, remove placeholder tool references (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

- [#217](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/217) [`eee5dbc`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/eee5dbc126db7a635389889204a504e25ea132fb) - Add MCP tool reference documentation for pwakit_development_guidelines and storefront_next_development_guidelines; MCP Server sidebar, Tools Reference, and nav updates in config (Thanks [@yhsieh1](https://github.com/yhsieh1)!)

## 0.2.0

### Minor Changes

- [#172](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/172) [`f82eaaf`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f82eaaf83b9d80636eaa03c746a5594db25a9c43) - Added MCP Server documentation (Thanks [@patricksullivansf](https://github.com/patricksullivansf)!)
