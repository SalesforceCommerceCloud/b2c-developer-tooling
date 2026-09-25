# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for create_instance_from_config (config → B2CInstance factory).

Mirrors the ``createInstanceFromConfig`` behaviour of
``packages/b2c-tooling-sdk/src/config/mapping.ts``.
"""

from __future__ import annotations

import pytest

from b2c_tooling_sdk.config.mapping import create_instance_from_config
from b2c_tooling_sdk.config.types import CreateB2CInstanceOptions, NormalizedConfig
from b2c_tooling_sdk.instance import B2CInstance


def test_raises_when_hostname_missing() -> None:
    with pytest.raises(ValueError, match="Hostname is required"):
        create_instance_from_config(NormalizedConfig(client_id="client"))


def test_returns_b2c_instance() -> None:
    instance = create_instance_from_config(NormalizedConfig(hostname="test.demandware.net"))
    assert isinstance(instance, B2CInstance)


def test_maps_instance_config_fields() -> None:
    instance = create_instance_from_config(
        NormalizedConfig(
            hostname="test.demandware.net",
            code_version="v2",
            webdav_hostname="dav.demandware.net",
            short_code="kv7kzm78",
            tenant_id="zzxy_prd",
            api_backend="scapi",
        )
    )
    config = instance.config
    assert config.hostname == "test.demandware.net"
    assert config.code_version == "v2"
    assert config.webdav_hostname == "dav.demandware.net"
    assert config.short_code == "kv7kzm78"
    assert config.tenant_id == "zzxy_prd"
    assert config.api_backend == "scapi"


def test_no_tls_options_when_not_configured() -> None:
    instance = create_instance_from_config(NormalizedConfig(hostname="test.demandware.net"))
    assert instance.config.tls_options is None


def test_tls_options_built_from_certificate() -> None:
    instance = create_instance_from_config(
        NormalizedConfig(
            hostname="test.demandware.net",
            certificate="/path/cert.p12",
            certificate_passphrase="secret",
        )
    )
    tls = instance.config.tls_options
    assert tls is not None
    assert tls.certificate == "/path/cert.p12"
    assert tls.passphrase == "secret"
    # self_signed unset -> reject_unauthorized True (verify server cert).
    assert tls.reject_unauthorized is True


def test_tls_options_built_from_self_signed() -> None:
    instance = create_instance_from_config(NormalizedConfig(hostname="test.demandware.net", self_signed=True))
    tls = instance.config.tls_options
    assert tls is not None
    # self_signed True -> reject_unauthorized False (accept self-signed cert).
    assert tls.reject_unauthorized is False


def test_injects_redirect_uri_and_open_browser_into_oauth() -> None:
    async def opener(url: str) -> None:
        return None

    instance = create_instance_from_config(
        NormalizedConfig(hostname="test.demandware.net", client_id="client"),
        CreateB2CInstanceOptions(redirect_uri="http://localhost:9000", open_browser=opener),
    )
    oauth = instance.auth.oauth
    assert oauth is not None
    assert oauth.redirect_uri == "http://localhost:9000"
    assert oauth.open_browser is opener


def test_does_not_inject_when_no_oauth_options() -> None:
    instance = create_instance_from_config(NormalizedConfig(hostname="test.demandware.net", client_id="client"))
    oauth = instance.auth.oauth
    assert oauth is not None
    assert oauth.redirect_uri is None
    assert oauth.open_browser is None


def test_passes_oauth_strategy_through_to_options() -> None:
    from b2c_tooling_sdk.auth.basic import BasicAuthStrategy

    sentinel = BasicAuthStrategy("u", "p")
    instance = create_instance_from_config(
        NormalizedConfig(hostname="test.demandware.net", client_id="client"),
        CreateB2CInstanceOptions(oauth_strategy=sentinel),
    )
    assert instance._get_oauth_strategy() is sentinel
