# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the persisted-session-backed StatefulOAuthStrategy."""

from __future__ import annotations

from collections.abc import Iterator

import httpx
import pytest
import respx

from b2c_tooling_sdk.auth.session_store import (
    AuthSession,
    InMemoryAuthSessionBackend,
    find_auth_session,
    save_auth_session,
    set_auth_session_backend,
)
from b2c_tooling_sdk.auth.stateful_oauth_strategy import StatefulOAuthStrategy, StatefulOAuthStrategyOptions
from tests.helpers.jwt import make_jwt

AM_HOST = "account.demandware.com"
TARGET_URL = "https://example.demandware.net/s/-/dw/data/v23_2/sites"
CLIENT_ID = "stateful-cid"


@pytest.fixture
def store() -> Iterator[InMemoryAuthSessionBackend]:
    backend = InMemoryAuthSessionBackend()
    set_auth_session_backend(backend)
    yield backend
    set_auth_session_backend(None)


def _session(access_token: str, *, scopes: list[str] | None = None) -> AuthSession:
    return AuthSession(
        client_id=CLIENT_ID,
        flow="client-credentials",
        access_token=access_token,
        sub="sa@example.com",
        expires_at="2099-01-01T00:00:00Z",
        scopes=scopes or ["sfcc.products"],
        account_manager_host=AM_HOST,
    )


def _persist(access_token: str, *, scopes: list[str] | None = None) -> AuthSession:
    record = _session(access_token, scopes=scopes)
    save_auth_session(record)
    return record


@respx.mock
async def test_fetch_injects_bearer_and_client_id(store: InMemoryAuthSessionBackend) -> None:
    token = make_jwt(expires_in=1800, scope="sfcc.products")
    record = _persist(token)
    target = respx.get(TARGET_URL).mock(return_value=httpx.Response(200, json={"ok": True}))

    response = await StatefulOAuthStrategy(record).fetch(TARGET_URL)

    assert response.status_code == 200
    request = target.calls.last.request
    assert request.headers["Authorization"] == f"Bearer {token}"
    assert request.headers["x-dw-client-id"] == CLIENT_ID


@respx.mock
async def test_fetch_clears_session_on_401(store: InMemoryAuthSessionBackend) -> None:
    record = _persist(make_jwt(expires_in=1800, scope="sfcc.products"))
    respx.get(TARGET_URL).mock(return_value=httpx.Response(401, json={"fault": {}}))

    response = await StatefulOAuthStrategy(record).fetch(TARGET_URL)

    assert response.status_code == 401
    # The stored session was deleted; the caller must re-authenticate.
    assert find_auth_session(CLIENT_ID) is None


@respx.mock
async def test_fetch_keeps_session_on_success(store: InMemoryAuthSessionBackend) -> None:
    record = _persist(make_jwt(expires_in=1800, scope="sfcc.products"))
    respx.get(TARGET_URL).mock(return_value=httpx.Response(200, json={"ok": True}))

    await StatefulOAuthStrategy(record).fetch(TARGET_URL)

    assert find_auth_session(CLIENT_ID) is not None


async def test_get_access_token_raises_without_session(store: InMemoryAuthSessionBackend) -> None:
    # Construct with an in-memory session but nothing persisted in the store.
    strategy = StatefulOAuthStrategy(_session(make_jwt(expires_in=1800)))
    with pytest.raises(RuntimeError, match="re-authenticate"):
        await strategy.get_authorization_header()


async def test_get_token_response_uses_jwt_claims(store: InMemoryAuthSessionBackend) -> None:
    token = make_jwt(expires_in=1800, scope="sfcc.products sfcc.catalogs")
    record = _persist(token, scopes=["ignored"])

    result = await StatefulOAuthStrategy(record).get_token_response()

    assert result.access_token == token
    # Scopes come from the JWT, not the stored session record.
    assert result.scopes == ["sfcc.products", "sfcc.catalogs"]


async def test_get_authorization_header_reads_latest_stored_token(store: InMemoryAuthSessionBackend) -> None:
    initial = make_jwt(expires_in=1800, scope="sfcc.products")
    record = _persist(initial)
    strategy = StatefulOAuthStrategy(record, StatefulOAuthStrategyOptions(AM_HOST, ["sfcc.products"]))

    # Another tool (e.g. the CLI) refreshes the stored token out-of-band.
    rotated = make_jwt(expires_in=3600, scope="sfcc.products", sub="sa@example.com")
    save_auth_session(_session(rotated))

    header = await strategy.get_authorization_header()
    assert header == f"Bearer {rotated}"


async def test_get_jwt_decodes_stored_token(store: InMemoryAuthSessionBackend) -> None:
    record = _persist(make_jwt(expires_in=1800, scope="sfcc.products", sub="sa@example.com"))

    decoded = await StatefulOAuthStrategy(record).get_jwt()

    assert decoded.payload["sub"] == "sa@example.com"


async def test_invalidate_token_deletes_and_blanks(store: InMemoryAuthSessionBackend) -> None:
    record = _persist(make_jwt(expires_in=1800, scope="sfcc.products"))
    strategy = StatefulOAuthStrategy(record)

    strategy.invalidate_token()

    assert find_auth_session(CLIENT_ID) is None
    # After invalidation the in-memory token is blank -> re-auth required.
    with pytest.raises(RuntimeError, match="re-authenticate"):
        await strategy.get_authorization_header()
