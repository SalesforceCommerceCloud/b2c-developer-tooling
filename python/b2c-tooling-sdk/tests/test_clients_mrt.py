# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the MRT and MRT B2C client factories.

Mirrors ``packages/b2c-tooling-sdk/test/clients/mrt.test.ts`` and
``mrt-b2c.test.ts``. Both clients are :class:`~b2c_tooling_sdk.clients._core.HttpClient`
instances that dispatch through ``httpx`` (intercepted here with ``respx``);
auth is applied via the auth middleware, which calls ``get_authorization_header``
on the strategy (typically backed by an API-key strategy for MRT).
"""

from __future__ import annotations

import httpx
import respx

from b2c_tooling_sdk.clients.mrt import (
    DEFAULT_MRT_ORIGIN,
    MrtClient,
    MrtClientConfig,
    create_mrt_client,
)
from b2c_tooling_sdk.clients.mrt_b2c import (
    DEFAULT_MRT_B2C_ORIGIN,
    MrtB2CClient,
    MrtB2CClientConfig,
    create_mrt_b2c_client,
)


class _FakeAuth:
    """Minimal auth strategy for the auth middleware (header injection + 401 retry)."""

    def __init__(self, header: str = "Bearer test-api-key") -> None:
        self._header = header
        self.invalidated = False

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated = True

    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:  # pragma: no cover - unused by HttpClient
        raise NotImplementedError


# --- mrt -------------------------------------------------------------------------


def test_default_mrt_origin() -> None:
    assert DEFAULT_MRT_ORIGIN == "https://cloud.mobify.com"


def test_create_mrt_client_returns_http_client() -> None:
    client = create_mrt_client(MrtClientConfig(), _FakeAuth())
    assert isinstance(client, MrtClient)


def test_mrt_base_url_uses_default_origin() -> None:
    client = create_mrt_client(MrtClientConfig(), _FakeAuth())
    assert client.base_url == DEFAULT_MRT_ORIGIN


def test_mrt_base_url_honors_origin_override() -> None:
    client = create_mrt_client(MrtClientConfig(origin="https://mrt.example.test"), _FakeAuth())
    assert client.base_url == "https://mrt.example.test"


def test_mrt_base_url_normalizes_missing_protocol() -> None:
    client = create_mrt_client(MrtClientConfig(origin="mrt.example.test"), _FakeAuth())
    assert client.base_url == "https://mrt.example.test"


def test_mrt_client_type_is_mrt() -> None:
    client = create_mrt_client(MrtClientConfig(), _FakeAuth())
    assert client.client_type == "mrt"


@respx.mock
async def test_mrt_authenticated_get_sends_api_key_authorization_header() -> None:
    route = respx.get(f"{DEFAULT_MRT_ORIGIN}/api/projects/").mock(return_value=httpx.Response(200, json={"data": []}))
    client = create_mrt_client(MrtClientConfig(), _FakeAuth("Bearer test-api-key"))

    result = await client.get("/api/projects/")

    assert result.error is None
    assert result.data == {"data": []}
    assert route.calls.last.request.headers["Authorization"] == "Bearer test-api-key"


# --- mrt-b2c -----------------------------------------------------------------------


def test_default_mrt_b2c_origin() -> None:
    assert DEFAULT_MRT_B2C_ORIGIN == "https://cloud.mobify.com/api/cc/b2c"


def test_create_mrt_b2c_client_returns_http_client() -> None:
    client = create_mrt_b2c_client(MrtB2CClientConfig(), _FakeAuth())
    assert isinstance(client, MrtB2CClient)


def test_mrt_b2c_base_url_uses_default_origin() -> None:
    client = create_mrt_b2c_client(MrtB2CClientConfig(), _FakeAuth())
    assert client.base_url == DEFAULT_MRT_B2C_ORIGIN


def test_mrt_b2c_base_url_honors_origin_override() -> None:
    client = create_mrt_b2c_client(MrtB2CClientConfig(origin="https://mrt-b2c.example.test"), _FakeAuth())
    assert client.base_url == "https://mrt-b2c.example.test"


def test_mrt_b2c_base_url_normalizes_missing_protocol() -> None:
    client = create_mrt_b2c_client(MrtB2CClientConfig(origin="mrt-b2c.example.test"), _FakeAuth())
    assert client.base_url == "https://mrt-b2c.example.test"


def test_mrt_b2c_client_type_is_mrt_b2c() -> None:
    client = create_mrt_b2c_client(MrtB2CClientConfig(), _FakeAuth())
    assert client.client_type == "mrt-b2c"


@respx.mock
async def test_mrt_b2c_authenticated_get_sends_api_key_authorization_header() -> None:
    route = respx.get(f"{DEFAULT_MRT_B2C_ORIGIN}/b2c-organization-info/my-org/").mock(
        return_value=httpx.Response(200, json={"is_b2c_customer": True, "instances": []})
    )
    client = create_mrt_b2c_client(MrtB2CClientConfig(), _FakeAuth("Bearer test-api-key"))

    result = await client.get("/b2c-organization-info/my-org/")

    assert result.error is None
    assert result.data == {"is_b2c_customer": True, "instances": []}
    assert route.calls.last.request.headers["Authorization"] == "Bearer test-api-key"
