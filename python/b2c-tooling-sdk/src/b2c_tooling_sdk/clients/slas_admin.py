# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SLAS Admin API client for B2C Commerce.

Mirrors ``src/clients/slas-admin.ts``. Provides a client for SLAS Admin API
operations such as administration tasks like managing tenants and SLAS
clients.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.middleware import create_auth_middleware, create_logging_middleware
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry

#: The typed SLAS client. Aliased to :class:`HttpClient` (the ``openapi-fetch``
#: ``Client`` analog).
SlasClient = HttpClient


@dataclass
class SlasClientConfig:
    """Configuration for creating a SLAS client."""

    #: The short code for the SCAPI instance (typically 4-8 alphanumeric chars).
    short_code: str
    #: Optional middleware registry override (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_slas_client(config: SlasClientConfig, auth: AuthStrategy) -> SlasClient:
    """Create a typed SLAS Admin API client.

    :param config: SLAS client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/shopper/auth-admin/v1",
        client_type="slas",
    )

    # Core middleware: auth first.
    client.use(create_auth_middleware(auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("slas"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("SLAS"))

    return client


__all__ = ["SlasClient", "SlasClientConfig", "create_slas_client"]
