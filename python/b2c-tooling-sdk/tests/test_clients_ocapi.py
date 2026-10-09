# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the OCAPI client factory.

Mirrors ``packages/b2c-tooling-sdk/test/clients/ocapi.test.ts``. The OCAPI client
is an :class:`~b2c_tooling_sdk.clients._core.HttpClient` that dispatches through
``httpx`` (intercepted here with ``respx``); auth is applied via the auth
middleware, which calls ``get_authorization_header`` on the strategy.
"""

from __future__ import annotations

import httpx
import respx

from b2c_tooling_sdk.clients.ocapi import DEFAULT_API_VERSION, OcapiClient, create_ocapi_client

HOSTNAME = "example.demandware.net"


class FakeAuth:
    """Minimal auth strategy for the auth middleware (header injection + 401 retry)."""

    def __init__(self, header: str = "Bearer test-token") -> None:
        self._header = header
        self.invalidated = False

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated = True

    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:  # pragma: no cover - unused by HttpClient
        raise NotImplementedError


def test_default_api_version() -> None:
    assert DEFAULT_API_VERSION == "v25_6"


def test_create_ocapi_client_returns_http_client() -> None:
    client = create_ocapi_client(HOSTNAME, FakeAuth())
    assert isinstance(client, OcapiClient)


def test_base_url_uses_default_api_version() -> None:
    client = create_ocapi_client(HOSTNAME, FakeAuth())
    assert client.base_url == f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}"


def test_base_url_honors_legacy_string_api_version() -> None:
    client = create_ocapi_client(HOSTNAME, FakeAuth(), "v22_10")
    assert client.base_url == f"https://{HOSTNAME}/s/-/dw/data/v22_10"


def test_base_url_honors_dict_api_version() -> None:
    client = create_ocapi_client(HOSTNAME, FakeAuth(), {"api_version": "v21_3"})
    assert client.base_url == f"https://{HOSTNAME}/s/-/dw/data/v21_3"


def test_client_type_is_ocapi() -> None:
    client = create_ocapi_client(HOSTNAME, FakeAuth())
    assert client.client_type == "ocapi"


@respx.mock
async def test_authenticated_get_returns_client_result_data() -> None:
    route = respx.get(f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/sites").mock(
        return_value=httpx.Response(200, json={"count": 2, "data": []})
    )
    client = create_ocapi_client(HOSTNAME, FakeAuth("Bearer abc"))

    result = await client.get("/sites")

    assert result.error is None
    assert result.data == {"count": 2, "data": []}
    assert result.response is not None
    assert result.response.status_code == 200
    assert route.calls.last.request.headers["Authorization"] == "Bearer abc"


@respx.mock
async def test_non_2xx_populates_error_not_data() -> None:
    respx.get(f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/sites/missing").mock(
        return_value=httpx.Response(404, json={"fault": {"type": "SiteNotFoundException", "message": "not found"}})
    )
    client = create_ocapi_client(HOSTNAME, FakeAuth())

    result = await client.get("/sites/missing")

    assert result.data is None
    assert result.error == {"fault": {"type": "SiteNotFoundException", "message": "not found"}}
    assert result.response is not None
    assert result.response.status_code == 404


@respx.mock
async def test_post_sends_json_body() -> None:
    route = respx.post(f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/code_versions").mock(
        return_value=httpx.Response(200, json={"id": "v1"})
    )
    client = create_ocapi_client(HOSTNAME, FakeAuth())

    result = await client.post("/code_versions", {"body": {"id": "v1"}})

    assert result.data == {"id": "v1"}
    request = route.calls.last.request
    assert request.headers["Content-Type"] == "application/json"
    assert request.content == b'{"id": "v1"}'


@respx.mock
async def test_query_params_are_forwarded() -> None:
    route = respx.get(f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/jobs").mock(
        return_value=httpx.Response(200, json={"total": 0})
    )
    client = create_ocapi_client(HOSTNAME, FakeAuth())

    await client.get("/jobs", {"params": {"query": {"start": 0, "count": 25, "skip": None}}})

    request = route.calls.last.request
    assert request.url.params["start"] == "0"
    assert request.url.params["count"] == "25"
    # None-valued query params are dropped (openapi-fetch semantics).
    assert "skip" not in request.url.params
