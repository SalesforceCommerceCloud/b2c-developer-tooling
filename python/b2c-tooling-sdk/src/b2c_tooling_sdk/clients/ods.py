# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""ODS (On-Demand Sandbox) API client for B2C Commerce.

Mirrors ``src/clients/ods.ts``. Provides a client for the Developer Sandbox
REST API (creating, deleting, starting/stopping sandboxes, and retrieving
realm/system information).

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.middleware import (
    create_auth_middleware,
    create_extra_params_middleware,
    create_logging_middleware,
)
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry
from b2c_tooling_sdk.defaults import DEFAULT_ODS_HOST

#: The typed ODS client. Aliased to :class:`HttpClient` (the ``openapi-fetch``
#: ``Client`` analog).
OdsClient = HttpClient


@dataclass
class OdsClientConfig:
    """Configuration for creating an ODS client."""

    #: The ODS API host. Defaults to the Unified region host
    #: (``admin.dx.commercecloud.salesforce.com``).
    host: str | None = None
    #: Extra parameters (``query``, ``body``, ``headers``) to add to all
    #: requests. Useful for internal/power-user scenarios where parameters
    #: aren't in the typed OpenAPI schema. See
    #: :func:`~b2c_tooling_sdk.clients.middleware.create_extra_params_middleware`.
    extra_params: dict[str, Any] | None = None
    #: Optional middleware registry override (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_ods_client(config: OdsClientConfig, auth: AuthStrategy) -> OdsClient:
    """Create a typed ODS (On-Demand Sandbox) API client.

    :param config: ODS client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    host = config.host or DEFAULT_ODS_HOST
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{host}/api/v1",
        client_type="ods",
    )

    # Core middleware: extraParams -> auth.
    if config.extra_params:
        client.use(create_extra_params_middleware(**config.extra_params))
    client.use(create_auth_middleware(auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("ods"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("ODS"))

    return client


__all__ = ["OdsClient", "OdsClientConfig", "create_ods_client"]
