# @salesforce/b2c-tooling-sdk-python

## 0.4.1

### Patch Changes

- [#667](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/667) [`f9110ac`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9110ace279f3f3290ceaac9104e6436d71d2688) - Hardened the Python SDK's `sync` facade: calling it from inside an already-running event loop (e.g. a Jupyter cell) now warns instead of silently blocking forever with no explanation, mixing direct `await` use and `sync` use of the same object now raises an actionable error instead of a confusing cross-loop `RuntimeError`, and syncified objects now preserve identity/equality with their async counterparts (`sync_obj == async_obj`, stable `is`/hashing across repeated calls). Also fixed a PKCE code example in the `b2c-python-sdk` skill that referenced a nonexistent `AuthCredentials` constructor. (Thanks [@priandsf](https://github.com/priandsf)!)

- [#667](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/pull/667) [`f9110ac`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/commit/f9110ace279f3f3290ceaac9104e6436d71d2688) - Fixed the WebDAV client sending the pre-middleware request body instead of the (possibly rewritten) post-middleware body, and made the OAuth redirect callback server bind both IPv4 and IPv6 loopback (`localhost`) instead of only `127.0.0.1`, fixing connection failures on systems where `localhost` resolves to `::1` first. (Thanks [@priandsf](https://github.com/priandsf)!)
