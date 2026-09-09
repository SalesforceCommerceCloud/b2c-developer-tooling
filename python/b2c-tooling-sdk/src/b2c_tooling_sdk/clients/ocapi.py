# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI client for B2C Commerce Data API operations.

Mirrors ``src/clients/ocapi.ts``. The TypeScript SDK returns an ``openapi-fetch``
``Client`` typed against the generated OCAPI schema; the Python port returns an
:class:`~b2c_tooling_sdk.clients._core.HttpClient` configured with the OCAPI base
URL and the standard middleware order (auth first, registry plugins, logging
last). Callers use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.

This client is typically accessed via :attr:`B2CInstance.ocapi` rather than
created directly.
"""

from __future__ import annotations

from typing import Any

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.middleware import create_auth_middleware, create_logging_middleware
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry

DEFAULT_API_VERSION = "v25_6"

#: The typed OCAPI client. Aliased to :class:`HttpClient` (the openapi-fetch
#: ``Client`` analog) until generated models land in a later phase.
OcapiClient = HttpClient


def create_ocapi_client(
    hostname: str,
    auth: AuthStrategy,
    options: dict[str, Any] | str | None = None,
    *,
    transport: Any = None,
) -> OcapiClient:
    """Create an OCAPI Data API client.

    :param hostname: B2C instance hostname.
    :param auth: Authentication strategy (typically OAuth).
    :param options: Optional ``{"api_version": ..., "middleware_registry": ...}``
        dict, or a bare string for the API version (backwards compatibility).
    :param transport: Optional TLS/mTLS transport for the underlying client.
    :returns: A configured :class:`HttpClient` for OCAPI.
    """
    if isinstance(options, str):
        opts: dict[str, Any] = {"api_version": options}
    else:
        opts = options or {}

    api_version = opts.get("api_version") or DEFAULT_API_VERSION
    registry: MiddlewareRegistry = opts.get("middleware_registry") or global_middleware_registry

    client = HttpClient(
        f"https://{hostname}/s/-/dw/data/{api_version}",
        client_type="ocapi",
        transport=transport,
    )

    # Core middleware: auth first.
    client.use(create_auth_middleware(auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("ocapi"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("OCAPI"))

    return client


__all__ = ["DEFAULT_API_VERSION", "OcapiClient", "create_ocapi_client"]
