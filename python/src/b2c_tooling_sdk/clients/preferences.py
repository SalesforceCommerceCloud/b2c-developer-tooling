# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Preferences API client for B2C Commerce.

Mirrors ``src/clients/preferences.ts``. Provides a client for the SCAPI
Configuration Preferences API (``/configuration/preferences/v1``). Supports
listing global and site custom preferences, reading and updating preferences
inside a preference group at the global (organization) or site level, and
searching site preferences across sites within a preference group.

Returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`; callers
use ``client.get(path, {...})`` etc., each returning a
:class:`~b2c_tooling_sdk.clients._core.ClientResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope
from b2c_tooling_sdk.clients.middleware import create_auth_middleware, create_logging_middleware
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry
from b2c_tooling_sdk.clients.models.preferences import (
    CustomPreference,
    CustomPreferenceList,
    OrganizationPreferences,
    PreferenceValue,
    PreferenceValueSearchResult,
    SearchRequest,
    SitePreferences,
)
from b2c_tooling_sdk.clients.models.preferences import (
    ErrorResponse as PreferencesError,
)
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes

#: The typed Preferences client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
PreferencesClient = HttpClient

#: Instance type accepted by the Preferences API path.
PreferenceInstanceType = Literal["staging", "development", "sandbox", "production"]

#: Default OAuth scopes required for Preferences (read-only).
PREFERENCES_READ_SCOPES = ["sfcc.preferences"]

#: OAuth scopes required for Preferences (read-write).
PREFERENCES_RW_SCOPES = ["sfcc.preferences.rw"]


@dataclass
class PreferencesClientConfig:
    """Configuration for creating a Preferences client."""

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
class PreferencesClientOptions:
    """Options for creating a Preferences client."""

    #: If true, request read-write scopes (``sfcc.preferences.rw``).
    #: If false or omitted, request read-only scopes (``sfcc.preferences``).
    read_write: bool = False


def create_preferences_client(
    config: PreferencesClientConfig,
    auth: AuthStrategy,
    options: PreferencesClientOptions | None = None,
) -> PreferencesClient:
    """Create a typed Preferences API client.

    Authentication is handled by middleware. The client automatically attaches:

    - Domain scope: ``sfcc.preferences`` (read) or ``sfcc.preferences.rw`` (read-write)
    - Tenant scope: ``SALESFORCE_COMMERCE_API:{tenant_id}``

    :param config: Preferences client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth).
    :param options: Optional settings such as ``read_write``.
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/configuration/preferences/v1",
        client_type="preferences",
    )

    domain_scopes = PREFERENCES_RW_SCOPES if options and options.read_write else PREFERENCES_READ_SCOPES
    required_scopes = config.scopes or [*domain_scopes, build_tenant_scope(config.tenant_id)]

    scoped_auth = with_scopes(auth, required_scopes)

    client.use(create_auth_middleware(scoped_auth))

    for middleware in registry.get_middleware("preferences"):
        client.use(middleware)

    client.use(create_logging_middleware("PREFERENCES"))

    return client


__all__ = [
    "PREFERENCES_READ_SCOPES",
    "PREFERENCES_RW_SCOPES",
    "CustomPreference",
    "CustomPreferenceList",
    "OrganizationPreferences",
    "PreferenceInstanceType",
    "PreferencesClient",
    "PreferencesClientConfig",
    "PreferencesClientOptions",
    "PreferencesError",
    "PreferenceValue",
    "PreferenceValueSearchResult",
    "SearchRequest",
    "SitePreferences",
    "create_preferences_client",
]
