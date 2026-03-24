# @salesforce/b2c-dx-docs

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
