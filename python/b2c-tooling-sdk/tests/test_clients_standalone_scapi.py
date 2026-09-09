# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the hand-built ("standalone") SCAPI client factories.

Mirrors the TS factories in ``src/clients/scapi-schemas.ts``,
``src/clients/cdn-zones.ts``, ``src/clients/preferences.ts``,
``src/clients/metrics.ts``, and ``src/clients/granular-replications.ts``.

Each factory returns a configured :class:`~b2c_tooling_sdk.clients._core.HttpClient`
wired with auth + logging (and, for granular replications, rate-limit)
middleware. These tests assert the base URL, the OAuth scope constants, the
scope selection for the read/write toggle clients, and (for one client) that a
respx-mocked request carries the expected ``Authorization`` header.
"""

from __future__ import annotations

import httpx
import respx

from b2c_tooling_sdk.clients.cdn_zones import (
    CDN_ZONES_READ_SCOPES,
    CDN_ZONES_RW_SCOPES,
    CdnZonesClientConfig,
    CdnZonesClientOptions,
    create_cdn_zones_client,
)
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope
from b2c_tooling_sdk.clients.granular_replications import (
    GranularReplicationsClientConfig,
    create_granular_replications_client,
)
from b2c_tooling_sdk.clients.metrics import (
    METRICS_DEFAULT_SCOPES,
    MetricsClientConfig,
    create_metrics_client,
)
from b2c_tooling_sdk.clients.preferences import (
    PREFERENCES_READ_SCOPES,
    PREFERENCES_RW_SCOPES,
    PreferencesClientConfig,
    PreferencesClientOptions,
    create_preferences_client,
)
from b2c_tooling_sdk.clients.scapi_schemas import (
    SCAPI_SCHEMAS_DEFAULT_SCOPES,
    ScapiSchemasClientConfig,
    create_scapi_schemas_client,
)

SHORT_CODE = "kv7kzm78"
TENANT_ID = "zzxy_prd"
TENANT_SCOPE = build_tenant_scope(TENANT_ID)


class _FakeAuth:
    """Minimal scoped auth strategy used to observe the scopes each factory requests."""

    def __init__(self, header: str = "Bearer test-token") -> None:
        self._header = header
        self.requested_scopes: list[str] | None = None
        self.invalidated = 0

    def with_additional_scopes(self, scopes: list[str]) -> _FakeAuth:
        self.requested_scopes = scopes
        return self

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated += 1


# --- SCAPI Schemas ---------------------------------------------------------------


def test_scapi_schemas_default_scopes() -> None:
    assert SCAPI_SCHEMAS_DEFAULT_SCOPES == ["sfcc.scapi-schemas"]


def test_create_scapi_schemas_client_base_url_and_type() -> None:
    config = ScapiSchemasClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)
    client = create_scapi_schemas_client(config, _FakeAuth())

    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/dx/scapi-schemas/v1"
    assert client.client_type == "scapi-schemas"


def test_create_scapi_schemas_client_requests_default_plus_tenant_scope() -> None:
    auth = _FakeAuth()
    config = ScapiSchemasClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_scapi_schemas_client(config, auth)

    assert auth.requested_scopes == [*SCAPI_SCHEMAS_DEFAULT_SCOPES, TENANT_SCOPE]


def test_create_scapi_schemas_client_honors_scope_override() -> None:
    auth = _FakeAuth()
    config = ScapiSchemasClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, scopes=["custom.scope"])

    create_scapi_schemas_client(config, auth)

    assert auth.requested_scopes == ["custom.scope"]


@respx.mock
async def test_scapi_schemas_authenticated_get_carries_authorization_header() -> None:
    route = respx.get(
        f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/dx/scapi-schemas/v1/organizations/f_ecom_{TENANT_ID}/schemas"
    ).mock(return_value=httpx.Response(200, json={"data": []}))
    config = ScapiSchemasClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)
    client = create_scapi_schemas_client(config, _FakeAuth("Bearer abc"))

    result = await client.get(f"/organizations/f_ecom_{TENANT_ID}/schemas")

    assert result.error is None
    assert result.data == {"data": []}
    assert route.calls.last.request.headers["Authorization"] == "Bearer abc"


# --- CDN Zones ---------------------------------------------------------------------


def test_cdn_zones_scope_constants() -> None:
    assert CDN_ZONES_READ_SCOPES == ["sfcc.cdn-zones"]
    assert CDN_ZONES_RW_SCOPES == ["sfcc.cdn-zones.rw"]


def test_create_cdn_zones_client_base_url_and_type() -> None:
    config = CdnZonesClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)
    client = create_cdn_zones_client(config, _FakeAuth())

    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/cdn/zones/v1"
    assert client.client_type == "cdn-zones"


def test_create_cdn_zones_client_defaults_to_read_scopes() -> None:
    auth = _FakeAuth()
    config = CdnZonesClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_cdn_zones_client(config, auth)

    assert auth.requested_scopes == [*CDN_ZONES_READ_SCOPES, TENANT_SCOPE]


def test_create_cdn_zones_client_read_write_option_selects_rw_scopes() -> None:
    auth = _FakeAuth()
    config = CdnZonesClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_cdn_zones_client(config, auth, CdnZonesClientOptions(read_write=True))

    assert auth.requested_scopes == [*CDN_ZONES_RW_SCOPES, TENANT_SCOPE]


# --- Preferences ---------------------------------------------------------------------


def test_preferences_scope_constants() -> None:
    assert PREFERENCES_READ_SCOPES == ["sfcc.preferences"]
    assert PREFERENCES_RW_SCOPES == ["sfcc.preferences.rw"]


def test_create_preferences_client_base_url_and_type() -> None:
    config = PreferencesClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)
    client = create_preferences_client(config, _FakeAuth())

    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/configuration/preferences/v1"
    assert client.client_type == "preferences"


def test_create_preferences_client_defaults_to_read_scopes() -> None:
    auth = _FakeAuth()
    config = PreferencesClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_preferences_client(config, auth)

    assert auth.requested_scopes == [*PREFERENCES_READ_SCOPES, TENANT_SCOPE]


def test_create_preferences_client_read_write_option_selects_rw_scopes() -> None:
    auth = _FakeAuth()
    config = PreferencesClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_preferences_client(config, auth, PreferencesClientOptions(read_write=True))

    assert auth.requested_scopes == [*PREFERENCES_RW_SCOPES, TENANT_SCOPE]


# --- Metrics ---------------------------------------------------------------------


def test_metrics_default_scopes() -> None:
    assert METRICS_DEFAULT_SCOPES == ["sfcc.metrics"]


def test_create_metrics_client_base_url_and_type() -> None:
    config = MetricsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)
    client = create_metrics_client(config, _FakeAuth())

    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/observability/metrics/v1"
    assert client.client_type == "metrics"


def test_create_metrics_client_requests_default_plus_tenant_scope() -> None:
    auth = _FakeAuth()
    config = MetricsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_metrics_client(config, auth)

    assert auth.requested_scopes == [*METRICS_DEFAULT_SCOPES, TENANT_SCOPE]


# --- Granular Replications ------------------------------------------------------


def test_create_granular_replications_client_base_url_and_type() -> None:
    config = GranularReplicationsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)
    client = create_granular_replications_client(config, _FakeAuth())

    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/operation/replications/v1"
    assert client.client_type == "granular-replications"


def test_create_granular_replications_client_default_scopes() -> None:
    auth = _FakeAuth()
    config = GranularReplicationsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID)

    create_granular_replications_client(config, auth)

    assert auth.requested_scopes == ["sfcc.granular-replications.rw", TENANT_SCOPE]


def test_create_granular_replications_client_honors_scope_override() -> None:
    auth = _FakeAuth()
    config = GranularReplicationsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, scopes=["custom.scope"])

    create_granular_replications_client(config, auth)

    assert auth.requested_scopes == ["custom.scope"]
