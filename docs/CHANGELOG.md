# @salesforce/b2c-dx-docs

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
