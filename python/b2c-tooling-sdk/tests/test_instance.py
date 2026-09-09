# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the B2C instance module (B2CInstance).

Mirrors ``packages/b2c-tooling-sdk/test/instance/scapi-client-config.test.ts``
plus the lazy-client and auth-strategy-selection behaviour of
``src/instance/index.ts``.
"""

from __future__ import annotations

import datetime
from pathlib import Path
from typing import NamedTuple

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

from b2c_tooling_sdk.auth.basic import BasicAuthStrategy
from b2c_tooling_sdk.auth.oauth import OAuthStrategy
from b2c_tooling_sdk.auth.oauth_jwt import JwtOAuthStrategy
from b2c_tooling_sdk.auth.types import AuthConfig, AuthStrategy, BasicAuthConfig, OAuthAuthConfig
from b2c_tooling_sdk.clients.ocapi import OcapiClient
from b2c_tooling_sdk.clients.tls import TlsOptions
from b2c_tooling_sdk.clients.webdav import WebDavClient
from b2c_tooling_sdk.instance import B2CInstance, B2CInstanceOptions, InstanceConfig, ScapiClientConfig

SHORT_CODE = "kv7kzm78"
TENANT_ID = "zzxy_prd"


class KeyPair(NamedTuple):
    cert_path: str
    key_path: str


@pytest.fixture
def key_pair(tmp_path: Path) -> KeyPair:
    """Generate an RSA key + self-signed cert PEM pair on disk for JWT strategies."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
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
    key_path = tmp_path / "key.pem"
    cert_path = tmp_path / "cert.pem"
    key_path.write_bytes(key_pem)
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    return KeyPair(cert_path=str(cert_path), key_path=str(key_path))


def _instance(config: InstanceConfig, auth: AuthConfig, options: B2CInstanceOptions | None = None) -> B2CInstance:
    return B2CInstance(config, auth, options)


def _scapi_config(**overrides: object) -> InstanceConfig:
    return InstanceConfig(hostname="test.demandware.net", short_code=SHORT_CODE, tenant_id=TENANT_ID, **overrides)  # type: ignore[arg-type]


# --- basic properties ------------------------------------------------------------


def test_webdav_hostname_falls_back_to_hostname() -> None:
    inst = _instance(InstanceConfig(hostname="test.demandware.net"), AuthConfig())
    assert inst.webdav_hostname == "test.demandware.net"


def test_webdav_hostname_uses_explicit_value() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net", webdav_hostname="dav.demandware.net"),
        AuthConfig(),
    )
    assert inst.webdav_hostname == "dav.demandware.net"


def test_api_backend_defaults_to_auto() -> None:
    inst = _instance(_scapi_config(), AuthConfig())
    assert inst.api_backend == "auto"


def test_api_backend_reflects_configured_preference() -> None:
    assert _instance(_scapi_config(api_backend="ocapi"), AuthConfig()).api_backend == "ocapi"
    assert _instance(_scapi_config(api_backend="scapi"), AuthConfig()).api_backend == "scapi"


# --- lazy clients ----------------------------------------------------------------


def test_webdav_returns_cached_webdav_client() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(basic=BasicAuthConfig(username="u", password="p")),
    )
    client = inst.webdav
    assert isinstance(client, WebDavClient)
    assert inst.webdav is client


def test_webdav_has_no_transport_without_tls_options() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(basic=BasicAuthConfig(username="u", password="p")),
    )
    assert inst.webdav._transport is None


def test_webdav_creates_transport_when_tls_options_present() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net", tls_options=TlsOptions(reject_unauthorized=False)),
        AuthConfig(basic=BasicAuthConfig(username="u", password="p")),
    )
    assert inst.webdav._transport is not None


def test_ocapi_returns_cached_ocapi_client() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client", client_secret="secret")),
    )
    client = inst.ocapi
    assert isinstance(client, OcapiClient)
    assert inst.ocapi is client


# --- WebDAV auth strategy selection ----------------------------------------------


def test_webdav_auth_prefers_basic_when_allowed_and_configured() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(
            basic=BasicAuthConfig(username="u", password="p"),
            oauth=OAuthAuthConfig(client_id="client", client_secret="secret"),
        ),
    )
    assert isinstance(inst._get_webdav_auth_strategy(), BasicAuthStrategy)


def test_webdav_auth_falls_back_to_oauth_when_basic_disallowed() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(
            auth_methods=["client-credentials"],
            basic=BasicAuthConfig(username="u", password="p"),
            oauth=OAuthAuthConfig(client_id="client", client_secret="secret"),
        ),
    )
    strategy = inst._get_webdav_auth_strategy()
    assert not isinstance(strategy, BasicAuthStrategy)
    assert isinstance(strategy, OAuthStrategy)


def test_webdav_auth_falls_back_to_oauth_when_basic_not_configured() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client", client_secret="secret")),
    )
    assert isinstance(inst._get_webdav_auth_strategy(), OAuthStrategy)


# --- OCAPI OAuth strategy selection ----------------------------------------------


def test_oauth_strategy_uses_injected_instance() -> None:
    sentinel = BasicAuthStrategy("u", "p")
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client")),
        B2CInstanceOptions(oauth_strategy=sentinel),
    )
    assert inst._get_oauth_strategy() is sentinel


def test_oauth_strategy_uses_injected_factory() -> None:
    sentinel = BasicAuthStrategy("u", "p")

    def factory() -> AuthStrategy:
        return sentinel

    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client")),
        B2CInstanceOptions(oauth_strategy=factory),
    )
    assert inst._get_oauth_strategy() is sentinel


def test_oauth_strategy_builds_from_config() -> None:
    inst = _instance(
        InstanceConfig(hostname="test.demandware.net"),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client", client_secret="secret")),
    )
    assert isinstance(inst._get_oauth_strategy(), OAuthStrategy)


def test_oauth_strategy_raises_without_oauth_config() -> None:
    inst = _instance(InstanceConfig(hostname="test.demandware.net"), AuthConfig())
    with pytest.raises(ValueError, match="OAuth credentials required"):
        inst._get_oauth_strategy()


def test_ocapi_oauth_uses_jwt_when_only_system_method(key_pair: KeyPair) -> None:
    inst = _instance(
        _scapi_config(),
        AuthConfig(
            oauth=OAuthAuthConfig(client_id="client", jwt_cert_path=key_pair.cert_path, jwt_key_path=key_pair.key_path)
        ),
    )
    assert isinstance(inst._get_oauth_strategy(), JwtOAuthStrategy)


def test_ocapi_oauth_honors_jwt_priority_over_client_credentials(key_pair: KeyPair) -> None:
    inst = _instance(
        _scapi_config(),
        AuthConfig(
            auth_methods=["jwt", "client-credentials"],
            oauth=OAuthAuthConfig(
                client_id="client",
                client_secret="secret",
                jwt_cert_path=key_pair.cert_path,
                jwt_key_path=key_pair.key_path,
            ),
        ),
    )
    assert isinstance(inst._get_oauth_strategy(), JwtOAuthStrategy)


# --- scapi_client_config (SCAPI eligible) ----------------------------------------


def test_scapi_config_builds_client_credentials_strategy() -> None:
    scapi = _instance(
        _scapi_config(),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client", client_secret="secret")),
    ).scapi_client_config
    assert isinstance(scapi, ScapiClientConfig)
    assert scapi.short_code == SHORT_CODE
    assert scapi.tenant_id == TENANT_ID
    assert isinstance(scapi.auth, OAuthStrategy)


def test_scapi_config_builds_jwt_strategy(key_pair: KeyPair) -> None:
    scapi = _instance(
        _scapi_config(),
        AuthConfig(
            oauth=OAuthAuthConfig(client_id="client", jwt_cert_path=key_pair.cert_path, jwt_key_path=key_pair.key_path)
        ),
    ).scapi_client_config
    assert scapi is not None
    assert isinstance(scapi.auth, JwtOAuthStrategy)


def test_scapi_config_prefers_client_credentials_over_jwt(key_pair: KeyPair) -> None:
    scapi = _instance(
        _scapi_config(),
        AuthConfig(
            oauth=OAuthAuthConfig(
                client_id="client",
                client_secret="secret",
                jwt_cert_path=key_pair.cert_path,
                jwt_key_path=key_pair.key_path,
            )
        ),
    ).scapi_client_config
    assert scapi is not None
    assert isinstance(scapi.auth, OAuthStrategy)


def test_scapi_config_honors_auth_methods_ordering(key_pair: KeyPair) -> None:
    scapi = _instance(
        _scapi_config(),
        AuthConfig(
            auth_methods=["jwt", "client-credentials"],
            oauth=OAuthAuthConfig(
                client_id="client",
                client_secret="secret",
                jwt_cert_path=key_pair.cert_path,
                jwt_key_path=key_pair.key_path,
            ),
        ),
    ).scapi_client_config
    assert scapi is not None
    assert isinstance(scapi.auth, JwtOAuthStrategy)


# --- scapi_client_config (not eligible) ------------------------------------------


def test_scapi_config_none_when_short_code_missing() -> None:
    scapi = _instance(
        InstanceConfig(hostname="test.demandware.net", tenant_id=TENANT_ID),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client", client_secret="secret")),
    ).scapi_client_config
    assert scapi is None


def test_scapi_config_none_when_tenant_id_missing() -> None:
    scapi = _instance(
        InstanceConfig(hostname="test.demandware.net", short_code=SHORT_CODE),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client", client_secret="secret")),
    ).scapi_client_config
    assert scapi is None


def test_scapi_config_none_for_implicit_flow() -> None:
    scapi = _instance(
        _scapi_config(),
        AuthConfig(oauth=OAuthAuthConfig(client_id="client")),
    ).scapi_client_config
    assert scapi is None


def test_scapi_config_does_not_use_injected_user_strategy() -> None:
    resolved = False

    def factory() -> AuthStrategy:
        nonlocal resolved
        resolved = True
        return BasicAuthStrategy("u", "p")

    inst = _instance(
        _scapi_config(),
        AuthConfig(auth_methods=["user"], oauth=OAuthAuthConfig(client_id="client")),
        B2CInstanceOptions(oauth_strategy=factory),
    )
    assert inst.scapi_client_config is None
    assert resolved is False


def test_scapi_config_none_for_basic_only() -> None:
    scapi = _instance(
        _scapi_config(),
        AuthConfig(basic=BasicAuthConfig(username="u", password="p")),
    ).scapi_client_config
    assert scapi is None
