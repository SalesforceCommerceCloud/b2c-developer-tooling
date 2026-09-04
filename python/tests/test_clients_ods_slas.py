# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the ODS and SLAS Admin client factories.

Mirrors ``packages/b2c-tooling-sdk/test/clients/ods.test.ts`` and
``.../slas-admin.test.ts``. Both clients are
:class:`~b2c_tooling_sdk.clients._core.HttpClient` instances that dispatch
through ``httpx`` (intercepted here with ``respx``); auth is applied via the
auth middleware, which calls ``get_authorization_header`` on the strategy.
"""

from __future__ import annotations

import httpx
import respx

from b2c_tooling_sdk.clients.ods import OdsClient, OdsClientConfig, create_ods_client
from b2c_tooling_sdk.clients.slas_admin import SlasClient, SlasClientConfig, create_slas_client
from b2c_tooling_sdk.defaults import DEFAULT_ODS_HOST

SHORT_CODE = "kv7kzm78"


class _FakeAuth:
    """Minimal auth strategy for the auth middleware (header injection + 401 retry)."""

    def __init__(self, header: str = "Bearer test-token") -> None:
        self._header = header
        self.invalidated = False

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated = True


# --- ODS --------------------------------------------------------------------


def test_ods_client_returns_http_client() -> None:
    client = create_ods_client(OdsClientConfig(), _FakeAuth())
    assert isinstance(client, OdsClient)


def test_ods_base_url_uses_default_host() -> None:
    client = create_ods_client(OdsClientConfig(), _FakeAuth())
    assert client.base_url == f"https://{DEFAULT_ODS_HOST}/api/v1"


def test_ods_base_url_honors_host_override() -> None:
    client = create_ods_client(OdsClientConfig(host="admin.dx-dev.commercecloud.salesforce.com"), _FakeAuth())
    assert client.base_url == "https://admin.dx-dev.commercecloud.salesforce.com/api/v1"


def test_ods_client_type_is_ods() -> None:
    client = create_ods_client(OdsClientConfig(), _FakeAuth())
    assert client.client_type == "ods"


@respx.mock
async def test_ods_authenticated_get_sends_authorization_header() -> None:
    route = respx.get(f"https://{DEFAULT_ODS_HOST}/api/v1/sandboxes").mock(
        return_value=httpx.Response(200, json={"data": []})
    )
    client = create_ods_client(OdsClientConfig(), _FakeAuth("Bearer ods-token"))

    result = await client.get("/sandboxes")

    assert result.error is None
    assert result.data == {"data": []}
    assert route.calls.last.request.headers["Authorization"] == "Bearer ods-token"


@respx.mock
async def test_ods_extra_params_adds_query_params() -> None:
    route = respx.get(f"https://{DEFAULT_ODS_HOST}/api/v1/sandboxes").mock(
        return_value=httpx.Response(200, json={"data": []})
    )
    client = create_ods_client(OdsClientConfig(extra_params={"query": {"expand": "clonedetails"}}), _FakeAuth())

    await client.get("/sandboxes")

    assert route.calls.last.request.url.params["expand"] == "clonedetails"


# --- SLAS Admin ---------------------------------------------------------------


def test_slas_client_returns_http_client() -> None:
    client = create_slas_client(SlasClientConfig(short_code=SHORT_CODE), _FakeAuth())
    assert isinstance(client, SlasClient)


def test_slas_base_url() -> None:
    client = create_slas_client(SlasClientConfig(short_code=SHORT_CODE), _FakeAuth())
    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth-admin/v1"


def test_slas_client_type_is_slas() -> None:
    client = create_slas_client(SlasClientConfig(short_code=SHORT_CODE), _FakeAuth())
    assert client.client_type == "slas"


@respx.mock
async def test_slas_authenticated_get_sends_authorization_header() -> None:
    route = respx.get(
        f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth-admin/v1/tenants/my-tenant"
    ).mock(return_value=httpx.Response(200, json={"tenantId": "my-tenant"}))
    client = create_slas_client(SlasClientConfig(short_code=SHORT_CODE), _FakeAuth("Bearer slas-token"))

    result = await client.get("/tenants/{tenantId}", {"params": {"path": {"tenantId": "my-tenant"}}})

    assert result.error is None
    assert result.data == {"tenantId": "my-tenant"}
    assert route.calls.last.request.headers["Authorization"] == "Bearer slas-token"
