# @salesforce/mrt-utilities

## 0.1.6

### Patch Changes

- [#385](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/385) [`933ea84`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/933ea841a85b8b667823b8acbfc2e401e105a195) - Rename development data-store environment variables from `SFNEXT_DATA_STORE_DEFAULTS`/`SFNEXT_DATA_STORE_WARN_ON_MISSING` to `MRT_DATA_STORE_DEFAULTS`/`MRT_DATA_STORE_WARN_ON_MISSING` and update docs/examples accordingly. (Thanks [@bendvc](https://github.com/bendvc)!)

## 0.1.5

### Patch Changes

- [`7ae80fe`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/7ae80fea7141d72182cc192756dbe2f5ee8e61fc) - Add a development-mode pseudo data-store implementation for `@salesforce/mrt-utilities/data-store` with environment-variable-backed defaults, while preserving the existing public API and production behavior. (Thanks [@bendvc](https://github.com/bendvc)!)

## 0.1.4

### Patch Changes

- [#379](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/379) [`c89e045`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/c89e045546dab14722f00b63ffe87db02942e486) - Fix package export resolution for consumers by stripping `development` export conditions during `prepack`, so published tarballs always resolve to shipped `dist` files. (Thanks [@bendvc](https://github.com/bendvc)!)

## 0.1.3

### Patch Changes

- [#361](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/361) [`ba2bca5`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ba2bca527d83c274b230a307f862697205872e92) - Updated the `qs` dependency to `6.14.1` to address a security vulnerability in `6.14.0`. (Thanks [@bendvc](https://github.com/bendvc)!)

## 0.1.2

### Patch Changes

- [#345](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/345) [`abad5e4`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/abad5e4e5fef192a88790943b4db1d50aea2b5aa) - Improved error handling in create-lambda-adapter.ts used for streaming support when deployed to Managed Runtime. (Thanks [@noahadams](https://github.com/noahadams)!)

- [#349](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/349) [`bc0e4b3`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/bc0e4b3b86d8481413c97be77d9d610f52d158f6) - Fixed CommonJS packaging for Node 22 by ensuring `require` entrypoints under `dist/cjs` are emitted as true CJS modules. Added dedicated `@salesforce/mrt-utilities/data-store` and `@salesforce/mrt-utilities/middleware/express` entrypoints so data-store imports do not have to load the Express middleware barrel during startup. (Thanks [@bendvc](https://github.com/bendvc)!)

## 0.1.1

### Patch Changes

- [#334](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/334) [`331db17`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/331db1778c964baefec204be6ba69ba5ce0a4360) - Add Express 4 support, improve middleware error handling, and add dual-version Express test coverage. (Thanks [@bendvc](https://github.com/bendvc)!)

## 0.1.0

### Minor Changes

- [`cca39c6`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/cca39c60608960be7f3aaca3edc2be6e80724709) - Initial publish of @salesforce/mrt-utilities via trusted publishing (Thanks [@clavery](https://github.com/clavery)!)

## 0.0.2

### Patch Changes

- [#216](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/216) [`6214103`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/6214103f8a962cc0533f88862570dee55a2466d6) - Initial release (Thanks [@kieran-sf](https://github.com/kieran-sf)!)
