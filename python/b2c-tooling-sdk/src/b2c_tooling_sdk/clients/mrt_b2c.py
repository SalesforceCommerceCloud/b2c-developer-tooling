# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Managed Runtime B2C Commerce API client.

Mirrors ``src/clients/mrt-b2c.ts``. Provides a client for the MRT B2C Commerce
integration API, which manages the connection between MRT targets and B2C
Commerce instances, using API-key authentication middleware rather than the
SCAPI OAuth cascade.

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
from b2c_tooling_sdk.clients.models.mrt_b2c import APIB2COrgInfo as B2COrgInfo
from b2c_tooling_sdk.clients.models.mrt_b2c import APIB2CTargetInfo as B2CTargetInfo
from b2c_tooling_sdk.clients.models.mrt_b2c import PatchedAPIB2CTargetInfo as PatchedB2CTargetInfo

#: The typed MRT B2C client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
MrtB2CClient = HttpClient

#: Default MRT B2C API origin.
DEFAULT_MRT_B2C_ORIGIN = "https://cloud.mobify.com/api/cc/b2c"


@dataclass
class MrtB2CClientConfig:
    """Configuration for creating an MRT B2C client."""

    #: The origin URL for the MRT B2C API. Defaults to :data:`DEFAULT_MRT_B2C_ORIGIN`.
    origin: str | None = None
    #: Middleware registry to use for this client. If not specified, uses the
    #: global middleware registry.
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_mrt_b2c_client(config: MrtB2CClientConfig, auth: AuthStrategy) -> MrtB2CClient:
    """Create a typed Managed Runtime B2C Commerce API client.

    This client handles the B2C Commerce integration endpoints, which manage
    the connection between MRT targets/environments and B2C Commerce
    instances. Authentication is handled via the auth middleware (typically
    backed by an API-key strategy) rather than the SCAPI OAuth scope cascade.

    :param config: MRT B2C client configuration.
    :param auth: Authentication strategy (typically an API-key strategy).
    :returns: A configured :class:`HttpClient`.
    """
    origin = config.origin or DEFAULT_MRT_B2C_ORIGIN
    registry = config.middleware_registry or global_middleware_registry

    # Normalize origin: add https:// if no protocol specified.
    if origin and not origin.startswith("http://") and not origin.startswith("https://"):
        origin = f"https://{origin}"

    client = HttpClient(origin, client_type="mrt-b2c")

    # Core middleware: auth first.
    client.use(create_auth_middleware(auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("mrt-b2c"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("MRT-B2C"))

    return client


__all__ = [
    "DEFAULT_MRT_B2C_ORIGIN",
    "B2COrgInfo",
    "B2CTargetInfo",
    "MrtB2CClient",
    "MrtB2CClientConfig",
    "PatchedB2CTargetInfo",
    "create_mrt_b2c_client",
]
