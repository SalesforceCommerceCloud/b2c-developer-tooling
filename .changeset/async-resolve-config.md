---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
---

`resolveConfig()` and the `ConfigSource` interface are now async. This enables config sources that perform async I/O such as keychain lookups, credential vaults, or network-based config stores.

**Breaking:** `resolveConfig()` now returns `Promise<ResolvedB2CConfig>` — callers must `await` the result. The `ConfigSource.load()` method return type is now `MaybePromise<ConfigLoadResult | undefined>`, so existing sync source implementations continue to work without changes.

Built-in sources (`DwJsonSource`, `MobifySource`, `PackageJsonSource`) now use async `fs.promises` for non-blocking file I/O. `InstanceManager` methods and `ConfigSource` instance management methods (`listInstances`, `createInstance`, `removeInstance`, `setActiveInstance`, `storeCredential`, `removeCredential`) also accept async return values via `MaybePromise<T>`.
