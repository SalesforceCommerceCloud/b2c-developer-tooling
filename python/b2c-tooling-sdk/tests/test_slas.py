# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SLAS Shopper Login module (PKCE helpers + token retrieval)."""

from __future__ import annotations

import base64
import re
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
import respx

from b2c_tooling_sdk.auth.client_credentials import encode_basic_client_credentials
from b2c_tooling_sdk.slas import (
    SlasRegisteredLoginConfig,
    SlasTokenConfig,
    SlasTokenResponse,
    generate_code_challenge,
    generate_code_verifier,
    get_guest_token,
    get_registered_token,
)

SHORT_CODE = "kv7kzm78"
ORG_ID = "f_ecom_abcd_123"
BASE_URL = f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/{ORG_ID}"
AUTHORIZE_URL = f"{BASE_URL}/oauth2/authorize"
TOKEN_URL = f"{BASE_URL}/oauth2/token"
LOGIN_URL = f"{BASE_URL}/oauth2/login"

MOCK_TOKEN_RESPONSE = {
    "access_token": "mock-access-token",
    "refresh_token": "mock-refresh-token",
    "expires_in": 1800,
    "token_type": "Bearer",
    "usid": "mock-usid",
    "customer_id": "mock-customer-id",
}

# Fixed 96-byte random source -> deterministic verifier / challenge (known-answer vector).
FIXED_RANDOM_96 = bytes(range(96))
FIXED_VERIFIER = (
    "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKis"
    "sLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5f"
)
FIXED_CHALLENGE = "10vGEdIUs89S5HPKbpL7Zkkl0o0Fu1gaA9ZhyeE_I74"


def _base_config(**overrides: object) -> SlasTokenConfig:
    params: dict[str, object] = {
        "short_code": SHORT_CODE,
        "organization_id": ORG_ID,
        "slas_client_id": "test-client-id",
        "site_id": "RefArch",
        "redirect_uri": "http://localhost:3000/callback",
    }
    params.update(overrides)
    return SlasTokenConfig(**params)  # type: ignore[arg-type]


def _token_json(**overrides: object) -> httpx.Response:
    body = {**MOCK_TOKEN_RESPONSE, **overrides}
    return httpx.Response(200, json=body)


def _redirect_303(location: str) -> httpx.Response:
    return httpx.Response(303, headers={"Location": location})


def _form(request: httpx.Request) -> dict[str, str]:
    parsed = parse_qs(request.content.decode())
    return {key: values[0] for key, values in parsed.items()}


def _query(request: httpx.Request) -> dict[str, str]:
    parsed = parse_qs(urlsplit(str(request.url)).query)
    return {key: values[0] for key, values in parsed.items()}


# --------------------------------------------------------------------------- #
# PKCE helpers
# --------------------------------------------------------------------------- #


class TestGenerateCodeVerifier:
    def test_generates_128_char_base64url_string(self) -> None:
        verifier = generate_code_verifier()
        assert len(verifier) == 128
        assert re.fullmatch(r"[A-Za-z0-9_-]+", verifier)

    def test_generates_unique_values(self) -> None:
        assert generate_code_verifier() != generate_code_verifier()

    def test_injected_random_source_is_deterministic(self) -> None:
        assert generate_code_verifier(FIXED_RANDOM_96) == FIXED_VERIFIER

    def test_monkeypatched_token_bytes_yields_expected_verifier(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(
            "b2c_tooling_sdk.slas.pkce.secrets.token_bytes",
            lambda n: bytes(range(n)),
        )
        assert generate_code_verifier() == FIXED_VERIFIER


class TestGenerateCodeChallenge:
    def test_known_answer_vector(self) -> None:
        assert generate_code_challenge(FIXED_VERIFIER) == FIXED_CHALLENGE

    def test_matches_manual_sha256(self) -> None:
        import hashlib

        verifier = generate_code_verifier()
        expected = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).rstrip(b"=").decode()
        assert generate_code_challenge(verifier) == expected

    def test_generates_43_char_base64url_string(self) -> None:
        challenge = generate_code_challenge(generate_code_verifier())
        assert len(challenge) == 43
        assert re.fullmatch(r"[A-Za-z0-9_-]+", challenge)

    def test_stable_for_same_verifier(self) -> None:
        verifier = generate_code_verifier()
        assert generate_code_challenge(verifier) == generate_code_challenge(verifier)


# --------------------------------------------------------------------------- #
# getGuestToken - public client (PKCE)
# --------------------------------------------------------------------------- #


@respx.mock
async def test_guest_public_pkce_flow() -> None:
    authorize = respx.get(AUTHORIZE_URL).mock(
        return_value=_redirect_303("http://localhost:3000/callback?code=auth-code-123&usid=usid-456")
    )
    token = respx.post(TOKEN_URL).mock(return_value=_token_json())

    result = await get_guest_token(_base_config())

    assert isinstance(result, SlasTokenResponse)
    assert result.access_token == "mock-access-token"
    assert result.refresh_token == "mock-refresh-token"
    assert result.expires_in == 1800
    assert result.usid == "mock-usid"

    aq = _query(authorize.calls.last.request)
    assert aq["client_id"] == "test-client-id"
    assert aq["response_type"] == "code"
    assert aq["hint"] == "guest"
    assert aq["redirect_uri"] == "http://localhost:3000/callback"
    assert len(aq["code_challenge"]) == 43

    tb = _form(token.calls.last.request)
    assert tb["grant_type"] == "authorization_code_pkce"
    assert tb["client_id"] == "test-client-id"
    assert tb["code"] == "auth-code-123"
    assert tb["code_verifier"]
    assert tb["redirect_uri"] == "http://localhost:3000/callback"
    assert tb["channel_id"] == "RefArch"
    assert tb["usid"] == "usid-456"


@respx.mock
async def test_guest_public_raises_when_authorize_not_303() -> None:
    respx.get(AUTHORIZE_URL).mock(return_value=httpx.Response(401, json={"error": "invalid_client"}))

    with pytest.raises(RuntimeError, match="authorize"):
        await get_guest_token(_base_config())


@respx.mock
async def test_guest_public_raises_when_location_missing() -> None:
    respx.get(AUTHORIZE_URL).mock(return_value=httpx.Response(303))

    with pytest.raises(RuntimeError, match="Location header"):
        await get_guest_token(_base_config())


# --------------------------------------------------------------------------- #
# getGuestToken - private client (client_credentials)
# --------------------------------------------------------------------------- #


@respx.mock
async def test_guest_private_client_credentials_flow() -> None:
    token = respx.post(TOKEN_URL).mock(return_value=_token_json())

    result = await get_guest_token(_base_config(slas_client_secret="test-secret"))

    assert result.access_token == "mock-access-token"

    request = token.calls.last.request
    expected_auth = encode_basic_client_credentials("test-client-id", "test-secret")
    assert request.headers["Authorization"] == f"Basic {expected_auth}"

    body = _form(request)
    assert body["grant_type"] == "client_credentials"
    assert body["channel_id"] == "RefArch"
    assert "code_verifier" not in body


@respx.mock
async def test_guest_private_raises_on_token_error() -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(401, json={"error": "invalid_client"}))

    with pytest.raises(RuntimeError) as exc:
        await get_guest_token(_base_config(slas_client_secret="bad-secret"))

    message = str(exc.value)
    assert "client_credentials" in message
    assert "401" in message


# --------------------------------------------------------------------------- #
# getRegisteredToken - public client
# --------------------------------------------------------------------------- #


def _registered_config(**overrides: object) -> SlasRegisteredLoginConfig:
    base = _base_config(**overrides)
    return SlasRegisteredLoginConfig(
        short_code=base.short_code,
        organization_id=base.organization_id,
        slas_client_id=base.slas_client_id,
        site_id=base.site_id,
        redirect_uri=base.redirect_uri,
        slas_client_secret=base.slas_client_secret,
        shopper_login="user@example.com",
        shopper_password="pass123",
    )


@respx.mock
async def test_registered_public_flow() -> None:
    login = respx.post(LOGIN_URL).mock(
        return_value=_redirect_303("http://localhost:3000/callback?code=reg-code-789&usid=usid-reg")
    )
    token = respx.post(TOKEN_URL).mock(return_value=_token_json())

    result = await get_registered_token(_registered_config())

    assert result.access_token == "mock-access-token"

    login_req = login.calls.last.request
    expected_auth = base64.b64encode(b"user@example.com:pass123").decode()
    assert login_req.headers["Authorization"] == f"Basic {expected_auth}"

    login_body = _form(login_req)
    assert login_body["client_id"] == "test-client-id"
    assert login_body["channel_id"] == "RefArch"
    assert len(login_body["code_challenge"]) == 43

    token_body = _form(token.calls.last.request)
    assert token_body["grant_type"] == "authorization_code_pkce"
    assert token_body["code"] == "reg-code-789"
    assert token_body["code_verifier"]
    # No Basic auth for a public client.
    assert "Authorization" not in token.calls.last.request.headers


# --------------------------------------------------------------------------- #
# getRegisteredToken - private client
# --------------------------------------------------------------------------- #


@respx.mock
async def test_registered_private_flow_sends_code_verifier_and_basic_auth() -> None:
    # Regression parity for W-23235332: the private-client token exchange must
    # still send the code_verifier with the authorization_code_pkce grant.
    login = respx.post(LOGIN_URL).mock(
        return_value=_redirect_303("http://localhost:3000/callback?code=priv-code&usid=usid-priv")
    )
    token = respx.post(TOKEN_URL).mock(return_value=_token_json())

    result = await get_registered_token(_registered_config(slas_client_secret="test-secret"))

    assert result.access_token == "mock-access-token"

    assert len(_form(login.calls.last.request)["code_challenge"]) == 43

    token_req = token.calls.last.request
    expected_auth = encode_basic_client_credentials("test-client-id", "test-secret")
    assert token_req.headers["Authorization"] == f"Basic {expected_auth}"

    body = _form(token_req)
    assert body["grant_type"] == "authorization_code_pkce"
    assert body["client_id"] == "test-client-id"
    assert body["code"] == "priv-code"
    assert body["code_verifier"]
    assert body["channel_id"] == "RefArch"
    assert body["usid"] == "usid-priv"


@respx.mock
async def test_registered_raises_when_login_not_303() -> None:
    respx.post(LOGIN_URL).mock(return_value=httpx.Response(401, json={"error": "invalid_credentials"}))

    with pytest.raises(RuntimeError, match="login"):
        await get_registered_token(_registered_config())
