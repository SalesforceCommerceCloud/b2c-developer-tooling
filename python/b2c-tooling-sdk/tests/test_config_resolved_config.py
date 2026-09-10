# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the resolved configuration (ResolvedConfigImpl / ResolvedB2CConfig).

Mirrors ``packages/b2c-tooling-sdk/test/config/resolved-config.test.ts``.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest

from b2c_tooling_sdk.config.config_source_registry import global_config_source_registry
from b2c_tooling_sdk.config.resolver import resolve_config
from b2c_tooling_sdk.config.types import CreateOAuthOptions, NormalizedConfig, ResolveConfigOptions
from b2c_tooling_sdk.instance import B2CInstance


@pytest.fixture(autouse=True)
def _isolate_cwd_and_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Point cwd/HOME at an empty temp dir so default sources never see real files."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("USERPROFILE", str(tmp_path))


@pytest.fixture(autouse=True)
def _clear_global_registry() -> Iterator[None]:
    global_config_source_registry.clear()
    yield
    global_config_source_registry.clear()


# --- validation methods ---------------------------------------------------------


async def test_has_b2c_instance_config_returns_true_when_hostname_is_present() -> None:
    config = await resolve_config(NormalizedConfig(hostname="test.demandware.net"))
    assert config.has_b2c_instance_config() is True


async def test_has_b2c_instance_config_returns_false_when_hostname_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    assert config.has_b2c_instance_config() is False


async def test_has_mrt_config_returns_true_when_mrt_api_key_is_present() -> None:
    config = await resolve_config(NormalizedConfig(mrt_api_key="test-api-key"))
    assert config.has_mrt_config() is True


async def test_has_mrt_config_returns_false_when_mrt_api_key_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    assert config.has_mrt_config() is False


async def test_has_oauth_config_returns_true_when_client_id_is_present() -> None:
    config = await resolve_config(NormalizedConfig(client_id="test-client"))
    assert config.has_oauth_config() is True


async def test_has_oauth_config_returns_false_when_client_id_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    assert config.has_oauth_config() is False


async def test_has_basic_auth_config_returns_true_when_username_and_password_are_present() -> None:
    config = await resolve_config(NormalizedConfig(username="user", password="pass"))
    assert config.has_basic_auth_config() is True


async def test_has_basic_auth_config_returns_false_when_username_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(password="pass"), ResolveConfigOptions(replace_default_sources=True))
    assert config.has_basic_auth_config() is False


async def test_has_basic_auth_config_returns_false_when_password_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(username="user"), ResolveConfigOptions(replace_default_sources=True))
    assert config.has_basic_auth_config() is False


# --- createB2CInstance -----------------------------------------------------------


async def test_create_b2c_instance_returns_instance_when_hostname_present() -> None:
    config = await resolve_config(NormalizedConfig(hostname="test.demandware.net", client_id="client"))
    instance = config.create_b2c_instance()
    assert isinstance(instance, B2CInstance)
    assert instance.config.hostname == "test.demandware.net"


async def test_create_b2c_instance_raises_when_hostname_missing() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    with pytest.raises(ValueError, match="B2C instance requires hostname"):
        config.create_b2c_instance()


# --- createBasicAuth -------------------------------------------------------------


async def test_create_basic_auth_creates_basic_auth_strategy_when_credentials_are_present() -> None:
    config = await resolve_config(NormalizedConfig(username="user", password="pass"))
    auth = config.create_basic_auth()
    assert auth is not None
    assert hasattr(auth, "fetch")
    assert callable(auth.fetch)


async def test_create_basic_auth_throws_error_when_username_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(password="pass"), ResolveConfigOptions(replace_default_sources=True))
    with pytest.raises(ValueError, match="Basic auth requires username and password"):
        config.create_basic_auth()


async def test_create_basic_auth_throws_error_when_password_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(username="user"), ResolveConfigOptions(replace_default_sources=True))
    with pytest.raises(ValueError, match="Basic auth requires username and password"):
        config.create_basic_auth()


# --- createOAuth ------------------------------------------------------------------


async def test_create_oauth_creates_oauth_strategy_when_client_id_is_present() -> None:
    config = await resolve_config(NormalizedConfig(client_id="test-client"))
    auth = config.create_oauth()
    assert auth is not None
    assert hasattr(auth, "fetch")
    assert callable(auth.fetch)


async def test_create_oauth_throws_error_when_client_id_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    with pytest.raises(ValueError, match="OAuth requires clientId"):
        config.create_oauth()


async def test_create_oauth_accepts_allowed_methods_option() -> None:
    config = await resolve_config(NormalizedConfig(client_id="test-client", client_secret="test-secret"))
    auth = config.create_oauth(CreateOAuthOptions(allowed_methods=["client-credentials"]))
    assert auth is not None


# --- createMrtAuth -----------------------------------------------------------------


async def test_create_mrt_auth_creates_api_key_strategy_when_mrt_api_key_is_present() -> None:
    config = await resolve_config(NormalizedConfig(mrt_api_key="test-api-key"))
    auth = config.create_mrt_auth()
    assert auth is not None
    assert hasattr(auth, "fetch")
    assert callable(auth.fetch)


async def test_create_mrt_auth_throws_error_when_mrt_api_key_is_missing() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    with pytest.raises(ValueError, match="MRT auth requires mrtApiKey"):
        config.create_mrt_auth()


# --- createWebDavAuth ---------------------------------------------------------------


async def test_create_webdav_auth_creates_basic_auth_strategy_when_basic_auth_is_available() -> None:
    config = await resolve_config(NormalizedConfig(username="user", password="pass"))
    auth = config.create_webdav_auth()
    assert auth is not None
    assert hasattr(auth, "fetch")
    assert callable(auth.fetch)


async def test_create_webdav_auth_creates_oauth_strategy_when_oauth_is_available_and_basic_auth_is_not() -> None:
    config = await resolve_config(NormalizedConfig(client_id="test-client"))
    auth = config.create_webdav_auth()
    assert auth is not None
    assert hasattr(auth, "fetch")
    assert callable(auth.fetch)


async def test_create_webdav_auth_throws_error_when_no_auth_is_available() -> None:
    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))
    with pytest.raises(
        ValueError, match=r"WebDAV auth requires basic auth \(username/password\) or OAuth \(clientId\)"
    ):
        config.create_webdav_auth()


# --- warnings and sources -----------------------------------------------------------


async def test_exposes_warnings_from_resolution() -> None:
    config = await resolve_config(NormalizedConfig(hostname="override.demandware.net"))
    assert isinstance(config.warnings, list)


async def test_exposes_sources_from_resolution() -> None:
    config = await resolve_config(NormalizedConfig(hostname="test.demandware.net"))
    assert isinstance(config.sources, list)


async def test_exposes_values_from_resolution() -> None:
    config = await resolve_config(NormalizedConfig(hostname="test.demandware.net", code_version="v1"))
    assert config.values is not None
    assert config.values.hostname == "test.demandware.net"
    assert config.values.code_version == "v1"
