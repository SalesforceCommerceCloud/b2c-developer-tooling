# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Blocking (synchronous) facade over the async ``b2c_tooling_sdk`` public API.

Every public callable in the top-level ``b2c_tooling_sdk.__all__`` (plus the four
SLAS shopper functions) has a synchronous twin here with an *identical* signature
minus ``await``::

    from b2c_tooling_sdk.sync import get_guest_token, resolve_config, create_metrics_client

    cfg = resolve_config()                 # blocks
    tok = get_guest_token(slas_config)     # blocks
    client = create_metrics_client(...)    # returns a blocking proxy

All calls run on a single persistent background event loop (see ``_runner``), so
the async SDK's token caching / single-flight semantics are preserved exactly.

This subpackage is intentionally NOT re-exported from the top-level
``b2c_tooling_sdk`` package; import it directly as ``b2c_tooling_sdk.sync``.

Classification of the mirrored symbols
--------------------------------------
Each public symbol is re-exported according to what calling it produces:

* **Coroutine functions** (``resolve_config``, the metrics ``get_*`` functions,
  the ``operations`` verbs, SLAS ``get_guest_token`` / ``get_registered_token``,
  ...) → wrapped with ``_wrap_callable`` (run on the loop, result syncified).
* **Synchronous factory functions** that return objects with coroutine methods
  (``create_*_client``, ``create_*_backend``, ``create_config_resolver``,
  ``create_instance_from_config``, ``resolve_auth_strategy``) → wrapped with
  ``_wrap_sync_factory`` (not run on the loop, but the returned object is
  syncified so its methods block). See ``_SYNC_FACTORIES``.
* **Everything else** — already-synchronous helpers (``to_organization_id``,
  ``decode_jwt``, PKCE ``generate_code_*``, ``parse_metrics_bound``, ...), the
  middleware factories (``create_auth_middleware`` /
  ``create_extra_params_middleware`` — their middleware objects must stay async
  for httpx), and all types, dataclasses, exceptions, enums, protocols and
  constants → re-exported AS-IS (the *same* objects as the async package, so
  ``isinstance`` and error handling work across both surfaces).

Streaming / async-generator APIs (e.g. log tailing, cartridge watching) are not
part of the top-level barrel and are therefore out of scope for this facade.
``watch_cartridges`` is a coroutine (not an async generator) and is wrapped.
"""

from __future__ import annotations

import inspect

import b2c_tooling_sdk as _async_sdk
from b2c_tooling_sdk import slas as _slas
from b2c_tooling_sdk.sync._proxy import _wrap_callable, _wrap_sync_factory

# Synchronous factory functions whose return value must be syncified (they are
# not coroutine functions, but the object they return exposes coroutine methods).
_SYNC_FACTORIES = frozenset(
    {
        "create_config_resolver",
        "create_instance_from_config",
        "resolve_auth_strategy",
        "create_account_manager_api_clients_client",
        "create_account_manager_orgs_client",
        "create_account_manager_roles_client",
        "create_account_manager_users_client",
        "create_cdn_zones_client",
        "create_custom_apis_client",
        "create_granular_replications_client",
        "create_metrics_client",
        "create_ocapi_client",
        "create_ods_client",
        "create_preferences_client",
        "create_slas_client",
        "create_scripts_backend",
        "create_users_backend",
        "create_roles_backend",
        "create_catalogs_backend",
    }
)

# SLAS shopper twins: two coroutine functions + the pure-sync PKCE helpers and
# the config/response types (re-exported as-is for use as call arguments).
_SLAS_ASYNC = ("get_guest_token", "get_registered_token")
_SLAS_PASSTHROUGH = (
    "generate_code_challenge",
    "generate_code_verifier",
    "SlasTokenConfig",
    "SlasTokenResponse",
    "SlasRegisteredLoginConfig",
)


def _build() -> dict[str, object]:
    exports: dict[str, object] = {}

    for name in _async_sdk.__all__:
        obj = getattr(_async_sdk, name)
        if inspect.iscoroutinefunction(obj):
            exports[name] = _wrap_callable(obj)
        elif name in _SYNC_FACTORIES:
            exports[name] = _wrap_sync_factory(obj)
        else:
            exports[name] = obj

    for name in _SLAS_ASYNC:
        exports[name] = _wrap_callable(getattr(_slas, name))
    for name in _SLAS_PASSTHROUGH:
        exports[name] = getattr(_slas, name)

    return exports


globals().update(_build())

# ``__all__`` is assembled from names (not string literals) so it mirrors the
# dynamically built exports above; the async ``__all__`` order is preserved.
__all__ = [*_async_sdk.__all__, *_SLAS_ASYNC, *_SLAS_PASSTHROUGH]
