# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for auth strategy resolution (resolve_auth_strategy / check_available_auth_methods)."""

from __future__ import annotations

from collections.abc import Iterator

import pytest

from b2c_tooling_sdk.auth.api_key import ApiKeyStrategy
from b2c_tooling_sdk.auth.basic import BasicAuthStrategy
from b2c_tooling_sdk.auth.oauth import OAuthStrategy
from b2c_tooling_sdk.auth.oauth_implicit import ImplicitOAuthStrategy
from b2c_tooling_sdk.auth.oauth_pkce import PkceOAuthStrategy
from b2c_tooling_sdk.auth.oauth_pkce_fallback import PkceWithImplicitFallbackStrategy
from b2c_tooling_sdk.auth.resolve import check_available_auth_methods, resolve_auth_strategy
from b2c_tooling_sdk.auth.session_store import InMemoryAuthSessionBackend, set_auth_session_backend
from b2c_tooling_sdk.auth.types import AuthCredentials


@pytest.fixture(autouse=True)
def store() -> Iterator[InMemoryAuthSessionBackend]:
    # The user (PKCE) strategy inspects the store for a persisted fallback marker.
    backend = InMemoryAuthSessionBackend()
    set_auth_session_backend(backend)
    yield backend
    set_auth_session_backend(None)


@pytest.fixture(autouse=True)
def _fallback_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SFCC_DISABLE_PKCE_FALLBACK", raising=False)


def test_resolves_client_credentials_when_secret_present() -> None:
    strategy = resolve_auth_strategy(AuthCredentials(client_id="cid", client_secret="secret"))
    assert isinstance(strategy, OAuthStrategy)


def test_client_credentials_preferred_over_user() -> None:
    # Both client-credentials and user are viable; client-credentials wins by priority.
    strategy = resolve_auth_strategy(AuthCredentials(client_id="cid", client_secret="secret"))
    assert isinstance(strategy, OAuthStrategy)


def test_resolves_user_pkce_when_no_secret() -> None:
    strategy = resolve_auth_strategy(AuthCredentials(client_id="cid"))
    assert isinstance(strategy, PkceWithImplicitFallbackStrategy)


def test_user_falls_back_to_plain_pkce_when_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SFCC_DISABLE_PKCE_FALLBACK", "1")
    strategy = resolve_auth_strategy(AuthCredentials(client_id="cid"))
    assert isinstance(strategy, PkceOAuthStrategy)
    assert not isinstance(strategy, PkceWithImplicitFallbackStrategy)


def test_forces_implicit_via_allowed_methods() -> None:
    strategy = resolve_auth_strategy(AuthCredentials(client_id="cid"), allowed_methods=["implicit"])
    assert isinstance(strategy, ImplicitOAuthStrategy)


def test_resolves_basic() -> None:
    strategy = resolve_auth_strategy(AuthCredentials(username="u", password="p"), allowed_methods=["basic"])
    assert isinstance(strategy, BasicAuthStrategy)


def test_resolves_api_key() -> None:
    strategy = resolve_auth_strategy(AuthCredentials(api_key="key"), allowed_methods=["api-key"])
    assert isinstance(strategy, ApiKeyStrategy)


def test_raises_when_no_method_available() -> None:
    with pytest.raises(RuntimeError) as exc_info:
        resolve_auth_strategy(AuthCredentials(), allowed_methods=["client-credentials", "basic"])
    message = str(exc_info.value)
    assert "No valid auth method available" in message
    assert "clientId is required" in message
    assert "username is required" in message


def test_check_available_reports_client_credentials_states() -> None:
    result = check_available_auth_methods(
        AuthCredentials(client_id="cid", client_secret="secret"),
        allowed_methods=["client-credentials", "user", "implicit", "basic", "api-key"],
    )
    assert "client-credentials" in result.available
    assert "user" in result.available
    assert "implicit" in result.available
    unavailable = {u.method: u.reason for u in result.unavailable}
    assert unavailable["basic"] == "username is required"
    assert unavailable["api-key"] == "apiKey is required"


def test_check_available_missing_secret_reason() -> None:
    result = check_available_auth_methods(AuthCredentials(client_id="cid"), allowed_methods=["client-credentials"])
    assert result.available == []
    assert result.unavailable[0].reason == "clientSecret is required"


def test_check_available_basic_missing_password() -> None:
    result = check_available_auth_methods(AuthCredentials(username="u"), allowed_methods=["basic"])
    assert result.unavailable[0].reason == "password is required"
