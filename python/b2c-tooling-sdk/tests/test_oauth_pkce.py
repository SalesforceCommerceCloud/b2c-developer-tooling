# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the Authorization Code + PKCE OAuth strategy."""

from __future__ import annotations

import socket
from collections.abc import Iterator

import httpx
import pytest
import respx

from b2c_tooling_sdk.auth.oauth_pkce import PkceGrantUnsupportedError, PkceOAuthConfig, PkceOAuthStrategy
from b2c_tooling_sdk.auth.session_store import (
    AuthSession,
    InMemoryAuthSessionBackend,
    find_auth_session,
    save_auth_session,
    set_auth_session_backend,
)
from tests.helpers.browser_sim import extract_query_param, http_get
from tests.helpers.jwt import make_jwt

AM_HOST = "account.demandware.com"
TOKEN_URL = f"https://{AM_HOST}/dwsso/oauth2/access_token"
TARGET_URL = "https://example.demandware.net/s/-/dw/data/v23_2/sites"
CLIENT_ID = "public-cid"


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


def _config(
    port: int, *, scopes: list[str] | None = None, code: str = "auth-code-123", **kwargs: object
) -> PkceOAuthConfig:
    async def opener(url: str) -> None:
        state = extract_query_param(url, "state")
        await http_get(f"http://127.0.0.1:{port}/?code={code}&state={state}")

    return PkceOAuthConfig(
        client_id=CLIENT_ID,
        scopes=scopes,
        account_manager_host=AM_HOST,
        local_port=port,
        open_browser=kwargs.pop("open_browser", opener),  # type: ignore[arg-type]
        **kwargs,  # type: ignore[arg-type]
    )


def _token_response(
    *, scope: str = "sfcc.products", refresh: str | None = "refresh-abc", expires_in: int = 1800
) -> httpx.Response:
    body: dict[str, object] = {
        "access_token": make_jwt(expires_in=expires_in, scope=scope, sub="user@example.com"),
        "expires_in": expires_in,
        "scope": scope,
    }
    if refresh is not None:
        body["refresh_token"] = refresh
    return httpx.Response(200, json=body)


@respx.mock
async def test_pkce_full_flow_exchanges_code(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    strategy = PkceOAuthStrategy(_config(free_port, scopes=["sfcc.products"]))

    token = await strategy.get_token_response()

    assert token.access_token
    body = token_route.calls.last.request.content.decode()
    assert "grant_type=authorization_code" in body
    assert "code=auth-code-123" in body
    assert "code_verifier=" in body
    assert f"client_id={CLIENT_ID}" in body


@respx.mock
async def test_pkce_authorize_url_uses_s256_challenge(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())
    captured: dict[str, str] = {}

    async def opener(url: str) -> None:
        captured["url"] = url
        state = extract_query_param(url, "state")
        await http_get(f"http://127.0.0.1:{free_port}/?code=c&state={state}")

    strategy = PkceOAuthStrategy(_config(free_port, scopes=["sfcc.products"], open_browser=opener))
    await strategy.get_token_response()

    assert extract_query_param(captured["url"], "response_type") == "code"
    assert extract_query_param(captured["url"], "code_challenge_method") == "S256"
    assert extract_query_param(captured["url"], "code_challenge")
    assert extract_query_param(captured["url"], "scope") == "sfcc.products"


@respx.mock
async def test_pkce_persists_session_with_refresh_token(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response(refresh="refresh-xyz"))
    strategy = PkceOAuthStrategy(_config(free_port, scopes=["sfcc.products"]))

    await strategy.get_token_response()

    stored = find_auth_session(CLIENT_ID)
    assert stored is not None
    assert stored.flow == "pkce"
    assert stored.refresh_token == "refresh-xyz"
    assert stored.sub == "user@example.com"


@respx.mock
async def test_pkce_state_mismatch_raises(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())

    async def opener(url: str) -> None:
        await http_get(f"http://127.0.0.1:{free_port}/?code=c&state=WRONG")

    strategy = PkceOAuthStrategy(_config(free_port, open_browser=opener))
    with pytest.raises(RuntimeError, match="state mismatch"):
        await strategy.get_token_response()


@respx.mock
async def test_pkce_grant_unsupported_error_on_invalid_client(
    free_port: int, store: InMemoryAuthSessionBackend
) -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(400, json={"error": "invalid_client"}))
    strategy = PkceOAuthStrategy(_config(free_port))

    with pytest.raises(PkceGrantUnsupportedError) as exc_info:
        await strategy.get_token_response()
    assert exc_info.value.stage == "token"
    assert exc_info.value.oauth_error == "invalid_client"


@respx.mock
async def test_pkce_non_grant_error_is_plain_runtime_error(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(400, json={"error": "invalid_scope"}))
    strategy = PkceOAuthStrategy(_config(free_port))

    with pytest.raises(RuntimeError) as exc_info:
        await strategy.get_token_response()
    assert not isinstance(exc_info.value, PkceGrantUnsupportedError)


@respx.mock
async def test_pkce_authorize_error_grant_unsupported(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    async def opener(url: str) -> None:
        await http_get(f"http://127.0.0.1:{free_port}/?error=unauthorized_client")

    strategy = PkceOAuthStrategy(_config(free_port, open_browser=opener))
    with pytest.raises(PkceGrantUnsupportedError) as exc_info:
        await strategy.get_token_response()
    assert exc_info.value.stage == "authorize"


@respx.mock
async def test_pkce_uses_refresh_token_without_browser(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    # Persist a PKCE session with a refresh token; the strategy should silently refresh.
    save_auth_session(
        AuthSession(
            client_id=CLIENT_ID,
            flow="pkce",
            access_token=make_jwt(expires_in=-100, scope="sfcc.products"),  # expired
            refresh_token="stored-refresh",
            expires_at="2020-01-01T00:00:00Z",
            scopes=["sfcc.products"],
            account_manager_host=AM_HOST,
        )
    )
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response(refresh="rotated-refresh"))

    browser_opened = False

    async def opener(url: str) -> None:
        nonlocal browser_opened
        browser_opened = True

    strategy = PkceOAuthStrategy(_config(free_port, scopes=["sfcc.products"], open_browser=opener))
    token = await strategy.get_token_response()

    assert token.access_token
    assert browser_opened is False
    body = token_route.calls.last.request.content.decode()
    assert "grant_type=refresh_token" in body
    assert "refresh_token=stored-refresh" in body
    # Rotated refresh token is persisted.
    assert find_auth_session(CLIENT_ID).refresh_token == "rotated-refresh"  # type: ignore[union-attr]


@respx.mock
async def test_pkce_refresh_failure_falls_back_to_browser(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    save_auth_session(
        AuthSession(
            client_id=CLIENT_ID,
            flow="pkce",
            access_token=make_jwt(expires_in=-100, scope="sfcc.products"),
            refresh_token="dead-refresh",
            expires_at="2020-01-01T00:00:00Z",
            scopes=["sfcc.products"],
            account_manager_host=AM_HOST,
        )
    )
    # First call (refresh) fails; second call (code exchange) succeeds.
    token_route = respx.post(TOKEN_URL).mock(
        side_effect=[httpx.Response(400, json={"error": "invalid_grant"}), _token_response()]
    )
    strategy = PkceOAuthStrategy(_config(free_port, scopes=["sfcc.products"]))

    token = await strategy.get_token_response()

    assert token.access_token
    assert token_route.call_count == 2
    assert "grant_type=authorization_code" in token_route.calls.last.request.content.decode()


@respx.mock
async def test_pkce_fetch_injects_bearer_and_client_id(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())
    target = respx.get(TARGET_URL).mock(return_value=httpx.Response(200, json={"ok": True}))

    response = await PkceOAuthStrategy(_config(free_port)).fetch(TARGET_URL)

    assert response.status_code == 200
    request = target.calls.last.request
    assert request.headers["Authorization"].startswith("Bearer ")
    assert request.headers["x-dw-client-id"] == CLIENT_ID
