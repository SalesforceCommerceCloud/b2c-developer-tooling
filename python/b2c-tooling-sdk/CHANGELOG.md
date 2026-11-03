# @salesforce/b2c-tooling-sdk-python

## 0.4.3

### Patch Changes

- [#834](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/834) [`ad5f946`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/ad5f946de076f552a7f5ceef96d16ca47e0a1f06) - Fix Metrics API series tags: dimensions no longer include the `<realm>_<environment>` prefix, and empty placeholder series no longer get bogus dimensions. (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.2

### Patch Changes

- [#814](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/814) [`b56cfbe`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/b56cfbe55d2b3b5c421318037b7822ff4708123d) - Debug logs no longer include the first characters of an API key (or the whole key when it is short). (Thanks [@clavery](https://github.com/clavery)!)

## 0.4.1

### Patch Changes

- [#667](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/667) [`f9110ac`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9110ace279f3f3290ceaac9104e6436d71d2688) - Hardened the Python SDK's `sync` facade: calling it from inside an already-running event loop (e.g. a Jupyter cell) now warns instead of silently blocking forever with no explanation, mixing direct `await` use and `sync` use of the same object now raises an actionable error instead of a confusing cross-loop `RuntimeError`, and syncified objects now preserve identity/equality with their async counterparts (`sync_obj == async_obj`, stable `is`/hashing across repeated calls). Also fixed a PKCE code example in the `b2c-python-sdk` skill that referenced a nonexistent `AuthCredentials` constructor. (Thanks [@priandsf](https://github.com/priandsf)!)

- [#667](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/667) [`f9110ac`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9110ace279f3f3290ceaac9104e6436d71d2688) - Fixed the WebDAV client sending the pre-middleware request body instead of the (possibly rewritten) post-middleware body, and made the OAuth redirect callback server bind both IPv4 and IPv6 loopback (`localhost`) instead of only `127.0.0.1`, fixing connection failures on systems where `localhost` resolves to `::1` first. (Thanks [@priandsf](https://github.com/priandsf)!)
