# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the legacy implicit-grant OAuth strategy."""

from __future__ import annotations

import socket
from collections.abc import Iterator

import httpx
import pytest
import respx

from b2c_tooling_sdk.auth.oauth_implicit import ImplicitOAuthConfig, ImplicitOAuthStrategy
from b2c_tooling_sdk.auth.session_store import (
    InMemoryAuthSessionBackend,
    find_auth_session,
    set_auth_session_backend,
)
from tests.helpers.browser_sim import extract_query_param, http_get
from tests.helpers.jwt import make_jwt

AM_HOST = "account.demandware.com"
TARGET_URL = "https://example.demandware.net/s/-/dw/data/v23_2/sites"
CLIENT_ID = "implicit-cid"


@pytest.fixture
def free_port() -> int:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return int(port)


@pytest.fixture
def store() -> Iterator[InMemoryAuthSessionBackend]:
    backend = InMemoryAuthSessionBackend()
    set_auth_session_backend(backend)
    yield backend
    set_auth_session_backend(None)


def _fragment_opener(port: int, *, expires_in: int = 1800, scope: str = "sfcc.products"):  # type: ignore[no-untyped-def]
    token = make_jwt(expires_in=expires_in, scope=scope, sub="impl@example.com")

    async def opener(url: str) -> None:
        # The browser first hits the redirect URI without a fragment -> server serves
        # the shim HTML; the shim then re-requests with the fragment as query params.
        await http_get(f"http://127.0.0.1:{port}/")
        await http_get(
            f"http://127.0.0.1:{port}/?access_token={token}&expires_in={expires_in}&scope={scope.replace(' ', '+')}"
        )

    return opener, token


def _config(port: int, opener, *, scopes: list[str] | None = None, **kwargs: object) -> ImplicitOAuthConfig:  # type: ignore[no-untyped-def]
    return ImplicitOAuthConfig(
        client_id=CLIENT_ID,
        scopes=scopes,
        account_manager_host=AM_HOST,
        local_port=port,
        open_browser=opener,
        **kwargs,  # type: ignore[arg-type]
    )


@respx.mock
async def test_implicit_flow_captures_token_from_fragment(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    opener, token = _fragment_opener(free_port, scope="sfcc.products")
    strategy = ImplicitOAuthStrategy(_config(free_port, opener, scopes=["sfcc.products"]))

    result = await strategy.get_token_response()

    assert result.access_token == token
    assert result.scopes == ["sfcc.products"]


@respx.mock
async def test_implicit_authorize_url_uses_response_type_token(
    free_port: int, store: InMemoryAuthSessionBackend
) -> None:
    captured: dict[str, str] = {}
    inner, token = _fragment_opener(free_port)

    async def opener(url: str) -> None:
        captured["url"] = url
        await inner(url)

    strategy = ImplicitOAuthStrategy(_config(free_port, opener, scopes=["sfcc.products"]))
    await strategy.get_token_response()

    assert extract_query_param(captured["url"], "response_type") == "token"
    assert extract_query_param(captured["url"], "client_id") == CLIENT_ID


@respx.mock
async def test_implicit_serves_shim_html_on_first_request(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    html: dict[str, str] = {}
    inner, _token = _fragment_opener(free_port)

    async def opener(url: str) -> None:
        status, body = await http_get(f"http://127.0.0.1:{free_port}/")
        html["status"] = str(status)
        html["body"] = body
        # Complete the flow with the token so the server shuts down.
        await inner(url)

    strategy = ImplicitOAuthStrategy(_config(free_port, opener, scopes=["sfcc.products"]))
    await strategy.get_token_response()

    assert html["status"] == "200"
    assert "doReturnFlow" in html["body"]
    assert "window.location.hash" in html["body"]


@respx.mock
async def test_implicit_persists_session_without_refresh(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    opener, _token = _fragment_opener(free_port, scope="sfcc.products")
    strategy = ImplicitOAuthStrategy(_config(free_port, opener, scopes=["sfcc.products"]))

    await strategy.get_token_response()

    stored = find_auth_session(CLIENT_ID)
    assert stored is not None
    assert stored.flow == "implicit"
    assert stored.refresh_token is None
    assert stored.sub == "impl@example.com"


@respx.mock
async def test_implicit_marks_pkce_unsupported_when_configured(
    free_port: int, store: InMemoryAuthSessionBackend
) -> None:
    opener, _token = _fragment_opener(free_port, scope="sfcc.products")
    strategy = ImplicitOAuthStrategy(_config(free_port, opener, scopes=["sfcc.products"], pkce_unsupported=True))

    await strategy.get_token_response()

    stored = find_auth_session(CLIENT_ID)
    assert stored is not None
    assert stored.pkce_unsupported is True


@respx.mock
async def test_implicit_error_redirect_raises(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    async def opener(url: str) -> None:
        await http_get(f"http://127.0.0.1:{free_port}/?error=access_denied&error_description=User+cancelled")

    strategy = ImplicitOAuthStrategy(_config(free_port, opener))
    with pytest.raises(RuntimeError, match="User cancelled"):
        await strategy.get_token_response()


@respx.mock
async def test_implicit_fetch_injects_bearer(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    opener, _token = _fragment_opener(free_port)
    target = respx.get(TARGET_URL).mock(return_value=httpx.Response(200, json={"ok": True}))

    response = await ImplicitOAuthStrategy(_config(free_port, opener)).fetch(TARGET_URL)

    assert response.status_code == 200
    request = target.calls.last.request
    assert request.headers["Authorization"].startswith("Bearer ")
    assert request.headers["x-dw-client-id"] == CLIENT_ID
