# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the transitional PKCE→implicit fallback strategy."""

from __future__ import annotations

import socket
from collections.abc import Iterator

import httpx
import pytest
import respx

from b2c_tooling_sdk.auth.oauth_pkce import PkceOAuthConfig, PkceOAuthStrategy
from b2c_tooling_sdk.auth.oauth_pkce_fallback import (
    PkceWithImplicitFallbackStrategy,
    create_user_auth_strategy,
    is_pkce_fallback_disabled,
)
from b2c_tooling_sdk.auth.session_store import (
    AuthSession,
    InMemoryAuthSessionBackend,
    save_auth_session,
    set_auth_session_backend,
)
from tests.helpers.browser_sim import extract_query_param, http_get
from tests.helpers.jwt import make_jwt

AM_HOST = "account.demandware.com"
TOKEN_URL = f"https://{AM_HOST}/dwsso/oauth2/access_token"
CLIENT_ID = "fallback-cid"


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


def _pkce_config(port: int, opener) -> PkceOAuthConfig:  # type: ignore[no-untyped-def]
    return PkceOAuthConfig(
        client_id=CLIENT_ID,
        scopes=["sfcc.products"],
        account_manager_host=AM_HOST,
        local_port=port,
        open_browser=opener,
    )


def test_is_pkce_fallback_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SFCC_DISABLE_PKCE_FALLBACK", raising=False)
    assert is_pkce_fallback_disabled() is False
    monkeypatch.setenv("SFCC_DISABLE_PKCE_FALLBACK", "1")
    assert is_pkce_fallback_disabled() is True
    monkeypatch.setenv("SFCC_DISABLE_PKCE_FALLBACK", "false")
    assert is_pkce_fallback_disabled() is False


def test_create_user_auth_strategy_selects_type(
    monkeypatch: pytest.MonkeyPatch, store: InMemoryAuthSessionBackend
) -> None:
    monkeypatch.delenv("SFCC_DISABLE_PKCE_FALLBACK", raising=False)
    assert isinstance(create_user_auth_strategy(PkceOAuthConfig(client_id=CLIENT_ID)), PkceWithImplicitFallbackStrategy)
    monkeypatch.setenv("SFCC_DISABLE_PKCE_FALLBACK", "1")
    assert isinstance(create_user_auth_strategy(PkceOAuthConfig(client_id=CLIENT_ID)), PkceOAuthStrategy)


@respx.mock
async def test_falls_back_to_implicit_on_grant_unsupported(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    implicit_token = make_jwt(expires_in=1800, scope="sfcc.products", sub="fb@example.com")

    async def opener(url: str) -> None:
        # PKCE authorize with response_type=code; complete it so the token exchange runs.
        if extract_query_param(url, "response_type") == "code":
            state = extract_query_param(url, "state")
            await http_get(f"http://127.0.0.1:{free_port}/?code=c&state={state}")
        else:
            # Implicit flow (response_type=token): return a token via the fragment shim.
            await http_get(
                f"http://127.0.0.1:{free_port}/?access_token={implicit_token}&expires_in=1800&scope=sfcc.products"
            )

    # PKCE token exchange returns invalid_client -> triggers fallback to implicit.
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(400, json={"error": "invalid_client"}))
    strategy = PkceWithImplicitFallbackStrategy(_pkce_config(free_port, opener))

    token = await strategy.get_token_response()

    assert token.access_token == implicit_token


@respx.mock
async def test_non_grant_error_propagates_without_fallback(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    async def opener(url: str) -> None:
        state = extract_query_param(url, "state")
        await http_get(f"http://127.0.0.1:{free_port}/?code=c&state={state}")

    respx.post(TOKEN_URL).mock(return_value=httpx.Response(400, json={"error": "invalid_scope"}))
    strategy = PkceWithImplicitFallbackStrategy(_pkce_config(free_port, opener))

    with pytest.raises(RuntimeError):
        await strategy.get_token_response()


async def test_persisted_unsupported_marker_skips_pkce(free_port: int, store: InMemoryAuthSessionBackend) -> None:
    # A prior implicit fallback left a pkceUnsupported marker -> go straight to implicit.
    save_auth_session(
        AuthSession(
            client_id=CLIENT_ID,
            flow="implicit",
            pkce_unsupported=True,
            access_token=make_jwt(expires_in=-100, scope="sfcc.products"),
            expires_at="2020-01-01T00:00:00Z",
            scopes=["sfcc.products"],
            account_manager_host=AM_HOST,
        )
    )
    implicit_token = make_jwt(expires_in=1800, scope="sfcc.products")
    seen_response_types: list[str | None] = []

    async def opener(url: str) -> None:
        seen_response_types.append(extract_query_param(url, "response_type"))
        await http_get(
            f"http://127.0.0.1:{free_port}/?access_token={implicit_token}&expires_in=1800&scope=sfcc.products"
        )

    strategy = PkceWithImplicitFallbackStrategy(_pkce_config(free_port, opener))
    token = await strategy.get_token_response()

    assert token.access_token == implicit_token
    # Never attempted the PKCE (response_type=code) authorize.
    assert seen_response_types == ["token"]
