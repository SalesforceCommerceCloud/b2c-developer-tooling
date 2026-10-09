# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Metrics API client for B2C Commerce (Observability).

Mirrors ``src/clients/metrics.ts``. Provides a client for the SCAPI
Observability Metrics API (``observability/metrics/v1``). The API exposes
time-series operational metrics (overall, sales, eCDN, third-party services,
SCAPI, SCAPI hooks, MRT, controllers, and OCAPI) for an organization.

Only the client factory is ported here; the metrics seconds/ms window
resolution operations logic (if any) lives elsewhere and is out of scope.

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
from b2c_tooling_sdk.clients.models.metrics import (
    DataPoint as MetricDataPoint,
)
from b2c_tooling_sdk.clients.models.metrics import (
    DataSeries as MetricDataSeries,
)
from b2c_tooling_sdk.clients.models.metrics import (
    ErrorResponse as MetricsError,
)
from b2c_tooling_sdk.clients.models.metrics import (
    Metric,
    MetricsDataResponse,
)
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes

#: The typed Metrics client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
MetricsClient = HttpClient

#: Default OAuth scope required for the Metrics API (read-only).
METRICS_DEFAULT_SCOPES = ["sfcc.metrics"]


@dataclass
class MetricsClientConfig:
    """Configuration for creating a Metrics API client."""

    #: The short code for the SCAPI instance (typically 4-8 alphanumeric chars).
    short_code: str
    #: The tenant ID (with or without ``f_ecom_`` prefix). Used to build the
    #: ``organizationId`` path parameter and tenant-specific OAuth scope.
    tenant_id: str
    #: Optional scope override. Defaults to the domain scope plus tenant scope.
    scopes: list[str] | None = None
    #: Optional middleware registry override (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def create_metrics_client(config: MetricsClientConfig, auth: AuthStrategy) -> MetricsClient:
    """Create a typed Metrics API client.

    The client automatically handles OAuth scope requirements:

    - Domain scope: ``sfcc.metrics`` (or custom via ``config.scopes``)
    - Tenant scope: ``SALESFORCE_COMMERCE_API:{tenant_id}``

    :param config: Metrics client configuration including short code and tenant ID.
    :param auth: Authentication strategy (typically OAuth client-credentials).
    :returns: A configured :class:`HttpClient`.
    """
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/observability/metrics/v1",
        client_type="metrics",
    )

    # Build required scopes: domain scope + tenant-specific scope.
    required_scopes = config.scopes or [*METRICS_DEFAULT_SCOPES, build_tenant_scope(config.tenant_id)]

    # If auth supports scopes, add required scopes; otherwise use as-is.
    scoped_auth = with_scopes(auth, required_scopes)

    # Core middleware: auth first.
    client.use(create_auth_middleware(scoped_auth))

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("metrics"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("METRICS"))

    return client


__all__ = [
    "METRICS_DEFAULT_SCOPES",
    "Metric",
    "MetricDataPoint",
    "MetricDataSeries",
    "MetricsClient",
    "MetricsClientConfig",
    "MetricsDataResponse",
    "MetricsError",
    "create_metrics_client",
]
