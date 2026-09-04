# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the OAuth client-credentials strategy and shared token cache."""

from __future__ import annotations

import asyncio

import httpx
import pytest
import respx

from b2c_tooling_sdk.auth.oauth import (
    OAuthConfig,
    OAuthStrategy,
    get_cached_oauth_token,
    get_oauth_cache_key,
)
from tests.helpers.jwt import make_jwt

TOKEN_URL = "https://account.demandware.com/dwsso/oauth2/access_token"
TARGET_URL = "https://example.demandware.net/s/-/dw/data/v23_2/sites"


def _token_response(scope: str = "sfcc.products", expires_in: int = 3600) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "access_token": make_jwt(expires_in=expires_in, scope=scope),
            "expires_in": expires_in,
            "scope": scope,
        },
    )


def _strategy(scopes: list[str] | None = None) -> OAuthStrategy:
    return OAuthStrategy(OAuthConfig(client_id="cid", client_secret="secret", scopes=scopes or ["sfcc.products"]))


@respx.mock
async def test_fetch_injects_bearer_and_client_id() -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())
    target = respx.get(TARGET_URL).mock(return_value=httpx.Response(200, json={"ok": True}))

    response = await _strategy().fetch(TARGET_URL)

    assert response.status_code == 200
    request = target.calls.last.request
    assert request.headers["Authorization"].startswith("Bearer ")
    assert request.headers["x-dw-client-id"] == "cid"


@respx.mock
async def test_token_endpoint_uses_basic_auth_and_grant() -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    respx.get(TARGET_URL).mock(return_value=httpx.Response(200))

    await _strategy().fetch(TARGET_URL)

    token_request = token_route.calls.last.request
    assert token_request.headers["Authorization"].startswith("Basic ")
    assert token_request.headers["Content-Type"] == "application/x-www-form-urlencoded"
    body = token_request.content.decode()
    assert "grant_type=client_credentials" in body
    assert "scope=sfcc.products" in body


@respx.mock
async def test_token_is_cached_across_requests() -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    respx.get(TARGET_URL).mock(return_value=httpx.Response(200))

    strategy = _strategy()
    await strategy.fetch(TARGET_URL)
    await strategy.fetch(TARGET_URL)

    assert token_route.call_count == 1


@respx.mock
async def test_single_flight_coalesces_concurrent_requests() -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())

    strategy = _strategy()
    await asyncio.gather(strategy.get_token_response(), strategy.get_token_response(), strategy.get_token_response())

    assert token_route.call_count == 1


@respx.mock
async def test_401_retry_after_prior_success() -> None:
    token_route = respx.post(TOKEN_URL).mock(side_effect=[_token_response(), _token_response()])
    respx.get(TARGET_URL).mock(
        side_effect=[httpx.Response(200), httpx.Response(401), httpx.Response(200, json={"ok": True})]
    )

    strategy = _strategy()
    await strategy.fetch(TARGET_URL)  # success -> sets _has_had_success
    response = await strategy.fetch(TARGET_URL)  # 401 -> invalidate -> retry -> 200

    assert response.status_code == 200
    assert token_route.call_count == 2


@respx.mock
async def test_no_retry_on_initial_401() -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    target = respx.get(TARGET_URL).mock(return_value=httpx.Response(401))

    response = await _strategy().fetch(TARGET_URL)

    assert response.status_code == 401
    assert target.call_count == 1
    assert token_route.call_count == 1


@respx.mock
async def test_get_authorization_header() -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())
    header = await _strategy().get_authorization_header()
    assert header.startswith("Bearer ")


@respx.mock
async def test_token_error_raises_with_body() -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(400, text="invalid_client"))
    with pytest.raises(RuntimeError, match="invalid_client"):
        await _strategy().get_token_response()


def test_cache_key_format() -> None:
    key = get_oauth_cache_key("cid", "client-credentials", "account.demandware.com", ["b", "a"])
    assert key == "account.demandware.com:cid:client-credentials:a,b"


def test_cache_key_empty_scopes() -> None:
    key = get_oauth_cache_key("cid", "jwt", "host", None)
    assert key == "host:cid:jwt:"


# --- Scope cascade ------------------------------------------------------------


@respx.mock
async def test_cascade_returns_first_accepted() -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response(scope="sfcc.jobs.rw"))
    strategy = OAuthStrategy(OAuthConfig(client_id="cid", client_secret="s", scopes=["SALESFORCE_COMMERCE_API:tenant"]))

    token = await strategy.get_access_token_for_cascade([["sfcc.jobs.rw"], ["sfcc.jobs"]])
    assert token


@respx.mock
async def test_cascade_skips_invalid_scope() -> None:
    responses = [
        httpx.Response(400, text="invalid_scope"),
        _token_response(scope="sfcc.jobs"),
    ]
    token_route = respx.post(TOKEN_URL).mock(side_effect=responses)
    strategy = OAuthStrategy(OAuthConfig(client_id="cid", client_secret="s", scopes=[]))

    token = await strategy.get_access_token_for_cascade([["sfcc.jobs.rw"], ["sfcc.jobs"]])
    assert token
    assert token_route.call_count == 2


@respx.mock
async def test_cascade_reuses_broader_cached_token() -> None:
    # AM grants a token whose scopes are a superset of a later narrower requirement.
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response(scope="sfcc.jobs sfcc.sites"))
    strategy = OAuthStrategy(OAuthConfig(client_id="cid", client_secret="s", scopes=[]))

    # First cascade caches a broad token (scopes: sfcc.jobs + sfcc.sites).
    await strategy.get_access_token_for_cascade([["sfcc.jobs", "sfcc.sites"]])
    assert token_route.call_count == 1
    # Second cascade needs only sfcc.jobs — satisfied by the cached broad token, no new AM call.
    await strategy.get_access_token_for_cascade([["sfcc.jobs"]])
    assert token_route.call_count == 1


@respx.mock
async def test_invalidate_token_forces_refresh() -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    strategy = _strategy()
    await strategy.get_token_response()
    strategy.invalidate_token()
    await strategy.get_token_response()
    assert token_route.call_count == 2


def test_with_additional_scopes_merges() -> None:
    strategy = _strategy(["a"])
    merged = strategy.with_additional_scopes(["b", "a"])
    # base scope 'a' deduped; new key includes 'a,b'
    key = get_oauth_cache_key("cid", "client-credentials", "account.demandware.com", ["a", "b"])
    assert get_cached_oauth_token(key) is None  # nothing cached yet, but key is well-formed
    assert isinstance(merged, OAuthStrategy)
