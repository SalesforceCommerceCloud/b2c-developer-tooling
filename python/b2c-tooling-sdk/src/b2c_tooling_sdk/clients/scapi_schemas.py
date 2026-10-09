# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Schemas API client for B2C Commerce.

Mirrors ``src/clients/scapi-schemas.ts``. Provides a client for SCAPI Schemas
API operations, used for discovering and retrieving OpenAPI schema
specifications for SCAPI APIs.

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
from b2c_tooling_sdk.clients.models.scapi_schemas import (
    ErrorResponse as ScapiSchemasError,
)
from b2c_tooling_sdk.clients.models.scapi_schemas import (
    OpenApiSchema,
    SchemaListItem,
    SchemaListResult,
)
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes

#: The typed SCAPI Schemas client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
ScapiSchemasClient = HttpClient

#: Default OAuth scopes required for SCAPI Schemas (read-only).
SCAPI_SCHEMAS_DEFAULT_SCOPES = ["sfcc.scapi-schemas"]


@dataclass
class ScapiSchemasClientConfig:
    """Configuration for creating a SCAPI Schemas client."""

    #: The short code for the SCAPI instance (typically 4-8 alphanumeric chars).
    short_code: str
    #: The tenant ID (with or without ``f_ecom_`` prefix). Used to build the
    #: ``organizationId`` path parameter and tenant-specific OAuth scope.
    tenant_id: str
    #: Optional scope override. Defaults to the domain scope plus tenant scope.
    scopes: list[str] | None = None
    #: Optional middleware registry override (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_scapi_schemas_client(config: ScapiSchemasClientConfig, auth: AuthStrategy) -> ScapiSchemasClient:
    """Create a typed SCAPI Schemas API client.

    The client automatically handles OAuth scope requirements:

    - Domain scope: ``sfcc.scapi-schemas`` (or custom via ``config.scopes``)
    - Tenant scope: ``SALESFORCE_COMMERCE_API:{tenant_id}``

    :param config: SCAPI Schemas client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/dx/scapi-schemas/v1",
        client_type="scapi-schemas",
    )

    # Build required scopes: domain scope + tenant-specific scope.
    required_scopes = config.scopes or [*SCAPI_SCHEMAS_DEFAULT_SCOPES, build_tenant_scope(config.tenant_id)]

    # If auth supports scopes, add required scopes; otherwise use as-is.
    scoped_auth = with_scopes(auth, required_scopes)

    # Core middleware: auth first.
    client.use(create_auth_middleware(scoped_auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("scapi-schemas"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("SCAPI-SCHEMAS"))

    return client


__all__ = [
    "SCAPI_SCHEMAS_DEFAULT_SCOPES",
    "OpenApiSchema",
    "ScapiSchemasClient",
    "ScapiSchemasClientConfig",
    "ScapiSchemasError",
    "SchemaListItem",
    "SchemaListResult",
    "create_scapi_schemas_client",
]
