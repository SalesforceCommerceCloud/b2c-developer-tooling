# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the core HTTP client + middleware chain (``clients/_core.py``).

Covers the openapi-fetch semantics ported to Python: :class:`ClientResult`
(never raises on 4xx/5xx), path/query/body building, network-failure wrapping,
the verb convenience methods, and middleware ordering (request in registration
order, response in reverse order).
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients._core import (
    ClientResult,
    HttpClient,
    MiddlewareRequestContext,
    MiddlewareResponseContext,
    apply_request_middleware,
    apply_response_middleware,
)
from b2c_tooling_sdk.errors.network_error import NetworkError

BASE_URL = "https://example.test"


class _RecordingMiddleware:
    """Middleware that records its label into a shared list on each hook."""

    def __init__(self, label: str, order: list[str]) -> None:
        self._label = label
        self._order = order

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        self._order.append(f"req:{self._label}")
        return ctx.request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        self._order.append(f"resp:{self._label}")
        return ctx.response


# --- ClientResult ---------------------------------------------------------------


def test_client_result_defaults() -> None:
    result = ClientResult()
    assert result.data is None
    assert result.error is None
    assert result.response is None


# --- request building + result convention ---------------------------------------


@respx.mock
async def test_get_success_populates_data_not_error() -> None:
    route = respx.get(f"{BASE_URL}/sites").mock(return_value=httpx.Response(200, json={"ok": True}))
    client = HttpClient(BASE_URL)

    result = await client.get("/sites")

    assert route.called
    assert result.data == {"ok": True}
    assert result.error is None
    assert result.response is not None and result.response.status_code == 200


@respx.mock
async def test_non_2xx_populates_error_and_never_raises() -> None:
    respx.get(f"{BASE_URL}/missing").mock(return_value=httpx.Response(404, json={"detail": "nope"}))
    client = HttpClient(BASE_URL)

    result = await client.get("/missing")

    assert result.data is None
    assert result.error == {"detail": "nope"}
    assert result.response is not None and result.response.status_code == 404


@respx.mock
async def test_path_params_are_templated_and_url_encoded() -> None:
    route = respx.get(f"{BASE_URL}/sites/a%20b").mock(return_value=httpx.Response(200, json={}))
    client = HttpClient(BASE_URL)

    await client.get("/sites/{siteId}", {"params": {"path": {"siteId": "a b"}}})

    assert route.called


@respx.mock
async def test_query_params_drop_none_values() -> None:
    route = respx.get(f"{BASE_URL}/search").mock(return_value=httpx.Response(200, json={}))
    client = HttpClient(BASE_URL)

    await client.get("/search", {"params": {"query": {"q": "shirt", "cursor": None}}})

    request = route.calls.last.request
    assert request.url.params.get("q") == "shirt"
    assert "cursor" not in request.url.params


@respx.mock
async def test_dict_body_is_json_encoded_with_content_type() -> None:
    route = respx.post(f"{BASE_URL}/items").mock(return_value=httpx.Response(201, json={}))
    client = HttpClient(BASE_URL)

    await client.post("/items", {"body": {"name": "widget"}})

    request = route.calls.last.request
    assert request.headers["Content-Type"] == "application/json"
    assert request.content == b'{"name": "widget"}'


@respx.mock
async def test_bytes_body_is_sent_verbatim_without_json_content_type() -> None:
    route = respx.put(f"{BASE_URL}/blob").mock(return_value=httpx.Response(200, json={}))
    client = HttpClient(BASE_URL)

    await client.put("/blob", {"body": b"\x00\x01raw", "headers": {"Content-Type": "application/octet-stream"}})

    request = route.calls.last.request
    assert request.content == b"\x00\x01raw"
    assert request.headers["Content-Type"] == "application/octet-stream"


@respx.mock
async def test_extra_headers_are_applied() -> None:
    route = respx.get(f"{BASE_URL}/thing").mock(return_value=httpx.Response(200, json={}))
    client = HttpClient(BASE_URL)

    await client.get("/thing", {"headers": {"X-Custom": "yes"}})

    assert route.calls.last.request.headers["X-Custom"] == "yes"


@respx.mock
async def test_empty_body_parses_to_none() -> None:
    respx.get(f"{BASE_URL}/empty").mock(return_value=httpx.Response(204))
    client = HttpClient(BASE_URL)

    result = await client.get("/empty")

    assert result.data is None
    assert result.error is None


@respx.mock
async def test_non_json_body_falls_back_to_text() -> None:
    respx.get(f"{BASE_URL}/text").mock(return_value=httpx.Response(200, text="plain text"))
    client = HttpClient(BASE_URL)

    result = await client.get("/text")

    assert result.data == "plain text"


# --- verb methods ---------------------------------------------------------------


@respx.mock
async def test_all_verb_methods_dispatch_expected_method() -> None:
    for verb, route_factory in (
        ("GET", respx.get),
        ("POST", respx.post),
        ("PUT", respx.put),
        ("PATCH", respx.patch),
        ("DELETE", respx.delete),
    ):
        route = route_factory(f"{BASE_URL}/r").mock(return_value=httpx.Response(200, json={}))
        client = HttpClient(BASE_URL)
        method = getattr(client, verb.lower())
        await method("/r")
        assert route.calls.last.request.method == verb


# --- network failures -----------------------------------------------------------


@respx.mock
async def test_transport_failure_is_wrapped_in_network_error() -> None:
    respx.get(f"{BASE_URL}/boom").mock(side_effect=httpx.ConnectError("refused"))
    client = HttpClient(BASE_URL)

    with pytest.raises(NetworkError):
        await client.get("/boom")


# --- middleware ordering --------------------------------------------------------


async def test_request_middleware_runs_in_registration_order() -> None:
    order: list[str] = []
    request = httpx.Request("GET", f"{BASE_URL}/x")
    middleware = [_RecordingMiddleware("a", order), _RecordingMiddleware("b", order)]

    await apply_request_middleware(request, middleware, client_type="custom")

    assert order == ["req:a", "req:b"]


async def test_response_middleware_runs_in_reverse_order() -> None:
    order: list[str] = []
    request = httpx.Request("GET", f"{BASE_URL}/x")
    response = httpx.Response(200)
    middleware = [_RecordingMiddleware("a", order), _RecordingMiddleware("b", order)]

    await apply_response_middleware(request, response, middleware, client_type="custom")

    assert order == ["resp:b", "resp:a"]


async def test_request_middleware_replacement_request_is_threaded() -> None:
    replacement = httpx.Request("GET", f"{BASE_URL}/replaced")

    class _Replacer:
        async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
            return replacement

    result = await apply_request_middleware(
        httpx.Request("GET", f"{BASE_URL}/orig"), [_Replacer()], client_type="custom"
    )

    assert result is replacement


@respx.mock
async def test_client_use_appends_middleware_that_runs() -> None:
    order: list[str] = []
    respx.get(f"{BASE_URL}/u").mock(return_value=httpx.Response(200, json={}))
    client = HttpClient(BASE_URL)
    client.use(_RecordingMiddleware("added", order))

    await client.get("/u")

    assert order == ["req:added", "resp:added"]
