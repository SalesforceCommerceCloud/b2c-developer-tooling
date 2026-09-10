# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the JWT Bearer OAuth strategy (RFC 7523)."""

from __future__ import annotations

import base64
import datetime
import json
from pathlib import Path
from typing import NamedTuple

import httpx
import pytest
import respx
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

from b2c_tooling_sdk.auth.oauth_jwt import JwtOAuthConfig, JwtOAuthStrategy
from tests.helpers.jwt import make_jwt

AM_HOST = "account.demandware.com"
TOKEN_URL = f"https://{AM_HOST}/dwsso/oauth2/access_token"
TARGET_URL = "https://example.demandware.net/s/-/dw/data/v23_2/sites"


class KeyPair(NamedTuple):
    cert_path: str
    key_path: str


def _write_key_pair(directory: Path, *, passphrase: str | None = None) -> KeyPair:
    """Generate an RSA key + self-signed cert PEM pair on disk."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    encryption: serialization.KeySerializationEncryption
    if passphrase:
        encryption = serialization.BestAvailableEncryption(passphrase.encode("utf-8"))
    else:
        encryption = serialization.NoEncryption()
    key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=encryption,
    )
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "test")])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc))
        .not_valid_after(datetime.datetime(2040, 1, 1, tzinfo=datetime.timezone.utc))
        .sign(key, hashes.SHA256())
    )
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)

    key_path = directory / "key.pem"
    cert_path = directory / "cert.pem"
    key_path.write_bytes(key_pem)
    cert_path.write_bytes(cert_pem)
    return KeyPair(cert_path=str(cert_path), key_path=str(key_path))


@pytest.fixture
def key_pair(tmp_path: Path) -> KeyPair:
    return _write_key_pair(tmp_path)


def _config(key_pair: KeyPair, *, scopes: list[str] | None = None, passphrase: str | None = None) -> JwtOAuthConfig:
    return JwtOAuthConfig(
        client_id="cid",
        cert_path=key_pair.cert_path,
        key_path=key_pair.key_path,
        account_manager_host=AM_HOST,
        passphrase=passphrase,
        scopes=scopes,
    )


def _token_response(scope: str = "sfcc.jobs", expires_in: int = 1800) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "access_token": make_jwt(expires_in=expires_in, scope=scope),
            "expires_in": expires_in,
            "scope": scope,
        },
    )


# --- Config validation --------------------------------------------------------


def test_missing_cert_file_raises(tmp_path: Path, key_pair: KeyPair) -> None:
    with pytest.raises(ValueError, match="certificate file not found"):
        JwtOAuthStrategy(
            JwtOAuthConfig(
                client_id="cid",
                cert_path=str(tmp_path / "nope.pem"),
                key_path=key_pair.key_path,
                account_manager_host=AM_HOST,
            )
        )


def test_invalid_cert_format_raises(tmp_path: Path, key_pair: KeyPair) -> None:
    bad = tmp_path / "bad-cert.pem"
    bad.write_text("not a certificate")
    with pytest.raises(ValueError, match="Invalid certificate format"):
        JwtOAuthStrategy(
            JwtOAuthConfig(
                client_id="cid",
                cert_path=str(bad),
                key_path=key_pair.key_path,
                account_manager_host=AM_HOST,
            )
        )


def test_encrypted_key_without_passphrase_raises(tmp_path: Path) -> None:
    pair = _write_key_pair(tmp_path, passphrase="s3cret")
    with pytest.raises(ValueError, match="encrypted but no passphrase"):
        JwtOAuthStrategy(_config(pair))


def test_encrypted_key_wrong_passphrase_raises(tmp_path: Path) -> None:
    pair = _write_key_pair(tmp_path, passphrase="s3cret")
    with pytest.raises(ValueError, match="Invalid passphrase"):
        JwtOAuthStrategy(_config(pair, passphrase="wrong"))


def test_encrypted_key_correct_passphrase_loads(tmp_path: Path) -> None:
    pair = _write_key_pair(tmp_path, passphrase="s3cret")
    strategy = JwtOAuthStrategy(_config(pair, passphrase="s3cret"))
    assert strategy is not None


# --- Token request ------------------------------------------------------------


@respx.mock
async def test_client_assertion_in_body_no_authorization_header(key_pair: KeyPair) -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    strategy = JwtOAuthStrategy(_config(key_pair, scopes=["sfcc.jobs"]))

    await strategy.get_token_response()

    request = token_route.calls.last.request
    assert "Authorization" not in request.headers
    assert request.headers["Content-Type"] == "application/x-www-form-urlencoded"
    body = request.content.decode()
    assert "grant_type=client_credentials" in body
    assert "client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer" in body
    assert "client_assertion=" in body
    assert "scope=sfcc.jobs" in body


@respx.mock
async def test_signed_assertion_is_well_formed(key_pair: KeyPair) -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    strategy = JwtOAuthStrategy(_config(key_pair))

    await strategy.get_token_response()

    body = token_route.calls.last.request.content.decode()
    assertion = next(part.split("=", 1)[1] for part in body.split("&") if part.startswith("client_assertion="))
    from urllib.parse import unquote

    assertion = unquote(assertion)
    header_b64, payload_b64, signature = assertion.split(".")
    assert signature  # RS256 signature present

    def _decode(seg: str) -> dict[str, object]:
        return json.loads(base64.urlsafe_b64decode(seg + "=" * (-len(seg) % 4)))

    header = _decode(header_b64)
    payload = _decode(payload_b64)
    assert header == {"alg": "RS256", "typ": "JWT"}
    assert payload["iss"] == "cid"
    assert payload["sub"] == "cid"
    assert payload["aud"] == TOKEN_URL
    assert isinstance(payload["exp"], int)


@respx.mock
async def test_signature_verifies_against_cert(key_pair: KeyPair) -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    strategy = JwtOAuthStrategy(_config(key_pair))

    await strategy.get_token_response()

    body = token_route.calls.last.request.content.decode()
    from urllib.parse import unquote

    assertion = next(unquote(part.split("=", 1)[1]) for part in body.split("&") if part.startswith("client_assertion="))
    header_b64, payload_b64, signature_b64 = assertion.split(".")
    signature = base64.urlsafe_b64decode(signature_b64 + "=" * (-len(signature_b64) % 4))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    from cryptography.hazmat.primitives.asymmetric import padding

    cert = x509.load_pem_x509_certificate(Path(key_pair.cert_path).read_bytes())
    public_key = cert.public_key()
    assert isinstance(public_key, rsa.RSAPublicKey)
    # Raises InvalidSignature if the assertion was not signed by the paired key.
    public_key.verify(signature, signing_input, padding.PKCS1v15(), hashes.SHA256())


@respx.mock
async def test_fetch_injects_bearer_and_client_id(key_pair: KeyPair) -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())
    target = respx.get(TARGET_URL).mock(return_value=httpx.Response(200, json={"ok": True}))

    response = await JwtOAuthStrategy(_config(key_pair)).fetch(TARGET_URL)

    assert response.status_code == 200
    request = target.calls.last.request
    assert request.headers["Authorization"].startswith("Bearer ")
    assert request.headers["x-dw-client-id"] == "cid"


@respx.mock
async def test_token_is_cached_across_requests(key_pair: KeyPair) -> None:
    token_route = respx.post(TOKEN_URL).mock(return_value=_token_response())
    respx.get(TARGET_URL).mock(return_value=httpx.Response(200))

    strategy = JwtOAuthStrategy(_config(key_pair, scopes=["sfcc.jobs"]))
    await strategy.fetch(TARGET_URL)
    await strategy.fetch(TARGET_URL)

    assert token_route.call_count == 1


@respx.mock
async def test_401_retry_after_prior_success(key_pair: KeyPair) -> None:
    token_route = respx.post(TOKEN_URL).mock(side_effect=[_token_response(), _token_response()])
    respx.get(TARGET_URL).mock(
        side_effect=[httpx.Response(200), httpx.Response(401), httpx.Response(200, json={"ok": True})]
    )

    strategy = JwtOAuthStrategy(_config(key_pair))
    await strategy.fetch(TARGET_URL)
    response = await strategy.fetch(TARGET_URL)

    assert response.status_code == 200
    assert token_route.call_count == 2


@respx.mock
async def test_default_expires_in_when_omitted(key_pair: KeyPair) -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(200, json={"access_token": make_jwt(scope="sfcc.jobs")}))
    strategy = JwtOAuthStrategy(_config(key_pair))

    token_response = await strategy.get_token_response()

    # ~1800s default lifetime.
    remaining = (token_response.expires - datetime.datetime.now(tz=datetime.timezone.utc)).total_seconds()
    assert 1700 < remaining <= 1800


@respx.mock
async def test_401_error_raises_registration_hint(key_pair: KeyPair) -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(401, text="bad signature"))
    with pytest.raises(RuntimeError, match="Invalid JWT signature or unregistered certificate"):
        await JwtOAuthStrategy(_config(key_pair)).get_token_response()


@respx.mock
async def test_400_error_includes_body(key_pair: KeyPair) -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(400, text="invalid_client"))
    with pytest.raises(RuntimeError, match="invalid_client"):
        await JwtOAuthStrategy(_config(key_pair)).get_token_response()


@respx.mock
async def test_missing_access_token_raises(key_pair: KeyPair) -> None:
    respx.post(TOKEN_URL).mock(return_value=httpx.Response(200, json={"expires_in": 1800}))
    with pytest.raises(RuntimeError, match="No access token"):
        await JwtOAuthStrategy(_config(key_pair)).get_token_response()


@respx.mock
async def test_get_authorization_header(key_pair: KeyPair) -> None:
    respx.post(TOKEN_URL).mock(return_value=_token_response())
    header = await JwtOAuthStrategy(_config(key_pair)).get_authorization_header()
    assert header.startswith("Bearer ")


def test_with_additional_scopes_merges(key_pair: KeyPair) -> None:
    strategy = JwtOAuthStrategy(_config(key_pair, scopes=["a"]))
    merged = strategy.with_additional_scopes(["b", "a"])
    assert isinstance(merged, JwtOAuthStrategy)


# --- Scope cascade ------------------------------------------------------------


@respx.mock
async def test_cascade_skips_invalid_scope(key_pair: KeyPair) -> None:
    token_route = respx.post(TOKEN_URL).mock(
        side_effect=[httpx.Response(400, text="invalid_scope"), _token_response(scope="sfcc.jobs")]
    )
    strategy = JwtOAuthStrategy(_config(key_pair, scopes=[]))

    token = await strategy.get_access_token_for_cascade([["sfcc.jobs.rw"], ["sfcc.jobs"]])
    assert token
    assert token_route.call_count == 2
