# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Custom APIs DX API client for B2C Commerce.

Mirrors ``src/clients/custom-apis.ts``. Provides a client for Custom APIs DX API
operations (retrieving the status of deployed Custom API endpoints) plus the
shared SCAPI tenant/organization/scope helpers (:func:`to_organization_id`,
:func:`normalize_tenant_id`, :func:`build_tenant_scope`) used across every SCAPI
domain client.

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
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes

#: The typed Custom APIs client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
CustomApisClient = HttpClient

#: Default OAuth scopes required for Custom APIs (read-only).
CUSTOM_APIS_DEFAULT_SCOPES = ["sfcc.custom-apis"]

#: Prefix required for a SCAPI ``organizationId``.
ORGANIZATION_ID_PREFIX = "f_ecom_"

#: Prefix for tenant-specific SCAPI OAuth scopes.
SCAPI_TENANT_SCOPE_PREFIX = "SALESFORCE_COMMERCE_API:"


@dataclass
class CustomApisClientConfig:
    """Configuration for creating a Custom APIs client."""

    #: The short code for the SCAPI instance (typically 4-8 alphanumeric chars).
    short_code: str
    #: The tenant ID (with or without ``f_ecom_`` prefix). Used to build the
    #: ``organizationId`` path parameter and tenant-specific OAuth scope.
    tenant_id: str
    #: Optional scope override. Defaults to the domain scope plus tenant scope.
    scopes: list[str] | None = None
    #: Optional middleware registry override (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_custom_apis_client(config: CustomApisClientConfig, auth: AuthStrategy) -> CustomApisClient:
    """Create a typed Custom APIs DX API client.

    The client automatically handles OAuth scope requirements:

    - Domain scope: ``sfcc.custom-apis`` (or custom via ``config.scopes``)
    - Tenant scope: ``SALESFORCE_COMMERCE_API:{tenant_id}``

    :param config: Custom APIs client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/dx/custom-apis/v1",
        client_type="custom-apis",
    )

    # Build required scopes: domain scope + tenant-specific scope.
    required_scopes = config.scopes or [*CUSTOM_APIS_DEFAULT_SCOPES, build_tenant_scope(config.tenant_id)]

    # If auth supports scopes, add required scopes; otherwise use as-is.
    scoped_auth = with_scopes(auth, required_scopes)

    # Core middleware: auth first.
    client.use(create_auth_middleware(scoped_auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("custom-apis"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("CUSTOM-APIS"))

    return client


def to_organization_id(tenant_id: str) -> str:
    """Ensure a tenant ID has the ``f_ecom_`` prefix for use as a SCAPI ``organizationId``.

    If the value already has the prefix, it's returned as-is.

    >>> to_organization_id("zzxy_prd")
    'f_ecom_zzxy_prd'
    >>> to_organization_id("f_ecom_zzxy_prd")
    'f_ecom_zzxy_prd'
    """
    return f"{ORGANIZATION_ID_PREFIX}{normalize_tenant_id(tenant_id)}"


def normalize_tenant_id(value: str) -> str:
    """Normalize any parseable tenant/organization ID form to canonical underscore format.

    Supported input forms (all resolve to ``abcd_123``):

    - ``abcd_123`` — canonical tenant ID (returned as-is)
    - ``abcd-123`` — hyphenated tenant ID
    - ``f_ecom_abcd_123`` — organization ID
    - ``f_ecom_abcd-123`` — org ID with hyphenated tenant
    - ``abcd-123.dx.commercecloud.salesforce.com`` — sandbox hostname

    >>> normalize_tenant_id("f_ecom_zzxy_prd")
    'zzxy_prd'
    >>> normalize_tenant_id("zzxy-prd")
    'zzxy_prd'
    >>> normalize_tenant_id("zzxy-prd.dx.commercecloud.salesforce.com")
    'zzxy_prd'
    """
    tenant = value.strip()

    # Extract hostname prefix: "abcd-123.dx.commercecloud.salesforce.com" -> "abcd-123".
    if "." in tenant:
        tenant = tenant.split(".")[0]

    # Strip f_ecom_ prefix (handles org ID form).
    if tenant.startswith(ORGANIZATION_ID_PREFIX):
        tenant = tenant[len(ORGANIZATION_ID_PREFIX) :]

    # Convert hyphens to underscores.
    return tenant.replace("-", "_")


def build_tenant_scope(tenant_id: str) -> str:
    """Build the tenant-specific OAuth scope required for SCAPI APIs.

    >>> build_tenant_scope("zzxy_prd")
    'SALESFORCE_COMMERCE_API:zzxy_prd'
    >>> build_tenant_scope("f_ecom_zzxy_prd")
    'SALESFORCE_COMMERCE_API:zzxy_prd'
    """
    return f"{SCAPI_TENANT_SCOPE_PREFIX}{normalize_tenant_id(tenant_id)}"


__all__ = [
    "CUSTOM_APIS_DEFAULT_SCOPES",
    "ORGANIZATION_ID_PREFIX",
    "SCAPI_TENANT_SCOPE_PREFIX",
    "CustomApisClient",
    "CustomApisClientConfig",
    "build_tenant_scope",
    "create_custom_apis_client",
    "normalize_tenant_id",
    "to_organization_id",
]
