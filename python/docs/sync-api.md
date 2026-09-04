# Synchronous API

The SDK is async-first, but not every program wants an event loop. The
`b2c_tooling_sdk.sync` subpackage is a **runtime facade**: every public callable
in the top-level `b2c_tooling_sdk` package (plus the four SLAS shopper functions)
has a synchronous twin here with an **identical signature minus `await`**.

```python
from b2c_tooling_sdk.sync import resolve_config, create_metrics_client
from b2c_tooling_sdk.sync import get_guest_token   # SLAS twins are here too

config = resolve_config()                 # blocks — no await
instance = config.create_b2c_instance()
```

## How it works

All calls run on a **single persistent background event loop**. Because the same
loop backs every call, the async SDK's token caching and single-flight semantics
are preserved exactly — a token minted by one sync call is reused by the next.

Symbols are mirrored according to what calling them produces:

- **Coroutine functions** (`resolve_config`, the metrics `get_*` functions, the
  operations verbs, SLAS `get_guest_token` / `get_registered_token`, ...) are run
  on the loop and their results synchronized.
- **Synchronous factory functions** that return objects with coroutine methods
  (`create_*_client`, `create_*_backend`, `create_config_resolver`,
  `create_instance_from_config`, `resolve_auth_strategy`) return a **blocking
  proxy** — the object's methods block when you call them.
- **Everything else** — already-synchronous helpers (`to_organization_id`,
  `decode_jwt`, the PKCE `generate_code_*` helpers, `parse_metrics_bound`, ...),
  the middleware factories, and all types, dataclasses, exceptions, enums,
  protocols, and constants — is re-exported **as-is**. These are the *same*
  objects as the async package, so `isinstance` checks and `except` clauses work
  identically across both surfaces.

## When to use it

Use the sync facade for scripts, notebooks, REPL sessions, and integrations with
synchronous frameworks where spinning up and managing an event loop is friction.
Use the async API directly when you are already inside an event loop (a web
server, another async application) or when you want to drive many operations
concurrently — the sync facade serializes calls onto its single loop.

!!! warning "Do not call the sync facade from within a running event loop"
    The blocking twins wait on a background loop; calling them from inside an
    already-running event loop can deadlock. Inside async code, import from
    `b2c_tooling_sdk` (or its submodules) and `await` instead.

## Streaming / async-generator caveat

Streaming and async-generator APIs — log tailing (`tail_logs`) and cartridge
watching — are **not** part of the top-level barrel and are therefore **out of
scope** for this facade. Use the async API directly for those. (Note that
`watch_cartridges` is a coroutine rather than an async generator, so it *is*
wrapped and available synchronously.)

## API reference

See the [sync section of the API reference](api-reference.md#synchronous-facade).
