---
'@salesforce/b2c-tooling-sdk-python': patch
'@salesforce/b2c-agent-plugins': patch
---

Hardened the Python SDK's `sync` facade: calling it from inside an already-running event loop (e.g. a Jupyter cell) now warns instead of silently blocking forever with no explanation, mixing direct `await` use and `sync` use of the same object now raises an actionable error instead of a confusing cross-loop `RuntimeError`, and syncified objects now preserve identity/equality with their async counterparts (`sync_obj == async_obj`, stable `is`/hashing across repeated calls). Also fixed a PKCE code example in the `b2c-python-sdk` skill that referenced a nonexistent `AuthCredentials` constructor.
