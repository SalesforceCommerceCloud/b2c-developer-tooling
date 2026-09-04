# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""CDN Zones API client for B2C Commerce.

Mirrors ``src/clients/cdn-zones.ts``. Provides a client for CDN Zones API
operations, used for managing eCDN configurations including zones,
certificates, WAF, rate limiting, cache purge, and other CDN settings.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope
from b2c_tooling_sdk.clients.middleware import create_auth_middleware, create_logging_middleware
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry
from b2c_tooling_sdk.clients.models.cdn_zones import (
    ApiStandardsErrorResponse as CdnZonesError,
)
from b2c_tooling_sdk.clients.models.cdn_zones import (
    Zone,
    ZonesEnvelope,
)
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes

#: The typed CDN Zones client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
CdnZonesClient = HttpClient

#: Default OAuth scopes required for CDN Zones (read-only).
CDN_ZONES_READ_SCOPES = ["sfcc.cdn-zones"]

#: OAuth scopes required for CDN Zones (read-write).
CDN_ZONES_RW_SCOPES = ["sfcc.cdn-zones.rw"]


@dataclass
class CdnZonesClientConfig:
    """Configuration for creating a CDN Zones client."""

    #: The short code for the SCAPI instance (typically 4-8 alphanumeric chars).
    short_code: str
    #: The tenant ID (with or without ``f_ecom_`` prefix). Used to build the
    #: ``organizationId`` path parameter and tenant-specific OAuth scope.
    tenant_id: str
    #: Optional scope override. Defaults to the domain scope plus tenant scope.
    scopes: list[str] | None = None
    #: Optional middleware registry override (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


@dataclass
class CdnZonesClientOptions:
    """Options for creating a CDN Zones client."""

    #: If true, request read-write scopes (``sfcc.cdn-zones.rw``).
    #: If false or omitted, request read-only scopes (``sfcc.cdn-zones``).
    read_write: bool = False


def create_cdn_zones_client(
    config: CdnZonesClientConfig,
    auth: AuthStrategy,
    options: CdnZonesClientOptions | None = None,
) -> CdnZonesClient:
    """Create a typed CDN Zones API client.

    The client automatically handles OAuth scope requirements:

    - Domain scope: ``sfcc.cdn-zones`` (read) or ``sfcc.cdn-zones.rw`` (read-write)
    - Tenant scope: ``SALESFORCE_COMMERCE_API:{tenant_id}``

    :param config: CDN Zones client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :param options: Optional settings such as ``read_write``.
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/cdn/zones/v1",
        client_type="cdn-zones",
    )

    # Build required scopes: domain scope + tenant-specific scope.
    domain_scopes = CDN_ZONES_RW_SCOPES if options and options.read_write else CDN_ZONES_READ_SCOPES
    required_scopes = config.scopes or [*domain_scopes, build_tenant_scope(config.tenant_id)]

    # If auth supports scopes, add required scopes; otherwise use as-is.
    scoped_auth = with_scopes(auth, required_scopes)

    # Core middleware: auth first.
    client.use(create_auth_middleware(scoped_auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("cdn-zones"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("CDN-ZONES"))

    return client


__all__ = [
    "CDN_ZONES_READ_SCOPES",
    "CDN_ZONES_RW_SCOPES",
    "CdnZonesClient",
    "CdnZonesClientConfig",
    "CdnZonesClientOptions",
    "CdnZonesError",
    "Zone",
    "ZonesEnvelope",
    "create_cdn_zones_client",
]
