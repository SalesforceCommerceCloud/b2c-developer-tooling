# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Granular Replications API client for B2C Commerce.

Mirrors ``src/clients/granular-replications.ts``. Provides a client for
Granular Replications API operations, used for publishing individual items
(products, price tables, content assets) from staging to production.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope
from b2c_tooling_sdk.clients.middleware import (
    create_auth_middleware,
    create_logging_middleware,
    create_rate_limit_middleware,
)
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry
from b2c_tooling_sdk.clients.models.granular_replications import (
    ContentAssetItemPrivate,
    ContentAssetItemShared,
    PriceTableItem,
    ProductItem,
    PublishIdResponse,
    PublishProcessListResponse,
    PublishProcessResponse,
)
from b2c_tooling_sdk.clients.models.granular_replications import (
    ErrorResponse as GranularReplicationsError,
)
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes

#: The typed Granular Replications client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
GranularReplicationsClient = HttpClient


@dataclass
class GranularReplicationsClientConfig:
    """Configuration for creating a Granular Replications API client.

    :param short_code: The instance short code (e.g. ``kv7kzm78``).
    :param tenant_id: The tenant ID (e.g. ``zzxy_prd``).
    :param scopes: Optional custom OAuth scopes. Defaults to
        ``sfcc.granular-replications.rw`` and the tenant-specific scope.
    :param middleware_registry: Optional custom middleware registry for
        request/response interceptors.
    """

    short_code: str
    tenant_id: str
    scopes: list[str] | None = None
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_granular_replications_client(
    config: GranularReplicationsClientConfig,
    auth: AuthStrategy,
) -> GranularReplicationsClient:
    """Create a Granular Replications API client for publishing individual items.

    The Granular Replications API enables programmatic publishing of individual
    items (products, price tables, content assets) from staging to production
    environments.

    :param config: Client configuration with short code and tenant ID.
    :param auth: OAuth authentication strategy.
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/operation/replications/v1",
        client_type="granular-replications",
    )

    # Build required scopes: domain scope + tenant-specific scope.
    required_scopes = config.scopes or ["sfcc.granular-replications.rw", build_tenant_scope(config.tenant_id)]
    scoped_auth = with_scopes(auth, required_scopes)

    client.use(create_auth_middleware(scoped_auth))

    for middleware in registry.get_middleware("granular-replications"):
        client.use(middleware)

    client.use(create_rate_limit_middleware(prefix="GRANULAR-REPLICATIONS"))
    client.use(create_logging_middleware("GRANULAR-REPLICATIONS"))

    return client


__all__ = [
    "ContentAssetItemPrivate",
    "ContentAssetItemShared",
    "GranularReplicationsClient",
    "GranularReplicationsClientConfig",
    "GranularReplicationsError",
    "PriceTableItem",
    "ProductItem",
    "PublishIdResponse",
    "PublishProcessListResponse",
    "PublishProcessResponse",
    "create_granular_replications_client",
]
