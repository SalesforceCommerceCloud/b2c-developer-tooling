# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Managed Runtime (MRT) API client for B2C Commerce.

Mirrors ``src/clients/mrt.ts``. Provides a client for Managed Runtime API
operations (managing deployments, bundles, projects, and environments) using
API-key authentication middleware rather than the SCAPI OAuth cascade.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.middleware import (
    create_auth_middleware,
    create_logging_middleware,
    create_rate_limit_middleware,
)
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry

#: The typed MRT client. Aliased to :class:`HttpClient` (the ``openapi-fetch``
#: ``Client`` analog).
MrtClient = HttpClient

#: Default MRT API origin.
DEFAULT_MRT_ORIGIN = "https://cloud.mobify.com"


@dataclass
class MrtClientConfig:
    """Configuration for creating an MRT client."""

    #: The origin URL for the MRT API. Defaults to :data:`DEFAULT_MRT_ORIGIN`.
    origin: str | None = None
    #: Middleware registry to use for this client. If not specified, uses the
    #: global middleware registry.
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_mrt_client(config: MrtClientConfig, auth: AuthStrategy) -> MrtClient:
    """Create a typed Managed Runtime API client.

    Authentication is handled via the auth middleware (typically backed by an
    API-key strategy) rather than the SCAPI OAuth scope cascade.

    :param config: MRT client configuration.
    :param auth: Authentication strategy (typically an API-key strategy).
    :returns: A configured :class:`HttpClient`.
    """
    origin = config.origin or DEFAULT_MRT_ORIGIN
    registry = config.middleware_registry or global_middleware_registry

    # Normalize origin: add https:// if no protocol specified.
    # The config resolver also normalizes, but this is a safety net for direct SDK usage.
    if origin and not origin.startswith("http://") and not origin.startswith("https://"):
        origin = f"https://{origin}"

    client = HttpClient(origin, client_type="mrt")

    # Core middleware: auth first.
    client.use(create_auth_middleware(auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("mrt"):
        client.use(middleware)

    # Rate limiting middleware (retries on 429 using Retry-After/header-based backoff).
    client.use(create_rate_limit_middleware(prefix="MRT"))

    # Logging middleware last (sees the complete request with all modifications).
    # Mask large base64-encoded bundle data in logs.
    client.use(create_logging_middleware({"prefix": "MRT", "mask_body_keys": ["data"]}))

    return client


__all__ = [
    "DEFAULT_MRT_ORIGIN",
    "MrtClient",
    "MrtClientConfig",
    "create_mrt_client",
]
