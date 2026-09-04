---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `b2c mrt bundle upload-v2` for building and uploading v2-format Managed Runtime bundles. The v2 archive is a gzip tar whose files live under a configurable root directory (default `bld/`) with the SSR configuration written inside the archive at `{root-dir}/{config-path}` (default `bld/.mrt/config.json`), uploaded as multipart/form-data. This command is upload-only — deploy the returned bundle ID with `b2c mrt bundle deploy <bundleId> -e <env>`. Every server-side parameter (root dir, config path, match mode, SSR patterns/parameters, dependencies, and CC overrides) is exposed as a flag. The SDK adds matching `createBundleV2`, `pushBundleV2`, and `uploadBundleV2` operations.

Bundle commands now read SSR configuration (`ssrOnly`/`ssrShared`/`ssrParameters`) from `config.server.ts` in the project directory, loaded straight from source, so it no longer needs to be compiled into the build output. Use `--project-directory` to point at a project other than the current directory (a compiled `config.server.js`/`config.server.mjs` and the legacy `build/config.server.js` are still accepted). For `upload-v2`, an on-disk v2 config file (`{build-dir}/{config-path}`) still takes precedence when present; command flags override the resolved values per key. The SDK's `createBundle`/`createBundleV2` gain a `projectDirectory` option for this.

Bundles now include the project's declared dependencies as bundle metadata (v1 `bundle_metadata.dependencies`; v2 `bundleMetadata.dependencies` inside the archive config), derived from the project `package.json` (`dependencies` + `devDependencies`) — matching pwa-kit/storefront-next. Explicitly provided dependencies (v2 `--dependencies`) or dependencies already present in the v2 config file take precedence; collection is best-effort and never blocks a bundle if `package.json` is missing or unreadable.
