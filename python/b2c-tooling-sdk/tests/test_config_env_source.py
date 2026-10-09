# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for config/sources/env_source (mirrors the TS ``config/EnvSource`` suite)."""

from __future__ import annotations

import dataclasses
import json
from pathlib import Path

import pytest

from b2c_tooling_sdk.config.resolver import ConfigResolver
from b2c_tooling_sdk.config.sources.dw_json_source import DwJsonSource
from b2c_tooling_sdk.config.sources.env_source import EnvSource
from b2c_tooling_sdk.config.types import ResolveConfigOptions

# --- CLI environment aliases -------------------------------------------------------

ALIASES: list[tuple[str, str, str]] = [
    ("SFCC_OAUTH_CLIENT_ID", "SFCC_CLIENT_ID", "client_id"),
    ("SFCC_OAUTH_CLIENT_SECRET", "SFCC_CLIENT_SECRET", "client_secret"),
    ("SFCC_LOGIN_URL", "SFCC_ACCOUNT_MANAGER_HOST", "account_manager_host"),
    ("SFCC_SHORT_CODE", "SFCC_SHORTCODE", "short_code"),
    ("SFCC_MRT_API_KEY", "MRT_API_KEY", "mrt_api_key"),
    ("SFCC_MRT_PROJECT", "MRT_PROJECT", "mrt_project"),
    ("SFCC_MRT_ENVIRONMENT", "MRT_ENVIRONMENT", "mrt_environment"),
    ("MRT_TARGET", "MRT_ENVIRONMENT", "mrt_environment"),
    ("SFCC_MRT_CLOUD_ORIGIN", "MRT_CLOUD_ORIGIN", "mrt_origin"),
]


@pytest.mark.parametrize(("alias", "canonical", "field"), ALIASES)
def test_maps_alias_to_field(alias: str, canonical: str, field: str) -> None:
    source = EnvSource({alias: "alias-value"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert getattr(result.config, field) == "alias-value"


@pytest.mark.parametrize(("alias", "canonical", "field"), ALIASES)
def test_canonical_takes_precedence_over_alias(alias: str, canonical: str, field: str) -> None:
    source = EnvSource({alias: "alias-value", canonical: "canonical-value"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert getattr(result.config, field) == "canonical-value"


def test_sfcc_mrt_environment_takes_precedence_over_mrt_target() -> None:
    source = EnvSource({"MRT_TARGET": "legacy-target", "SFCC_MRT_ENVIRONMENT": "sfcc-environment"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.mrt_environment == "sfcc-environment"


# --- string mapping ----------------------------------------------------------------


@pytest.mark.parametrize(
    ("env_var", "field", "value"),
    [
        ("SFCC_SERVER", "hostname", "test.demandware.net"),
        ("SFCC_WEBDAV_SERVER", "webdav_hostname", "webdav.example.com"),
        ("SFCC_CODE_VERSION", "code_version", "v1"),
        ("SFCC_USERNAME", "username", "user@example.com"),
        ("SFCC_PASSWORD", "password", "secret"),
        ("SFCC_CERTIFICATE", "certificate", "/path/to/cert.p12"),
        ("SFCC_CERTIFICATE_PASSPHRASE", "certificate_passphrase", "pass123"),
        ("SFCC_CLIENT_ID", "client_id", "my-client"),
        ("SFCC_CLIENT_SECRET", "client_secret", "my-secret"),
        ("SFCC_SHORTCODE", "short_code", "abc123"),
        ("SFCC_SHORT_CODE", "short_code", "abc123"),
        ("SFCC_TENANT_ID", "tenant_id", "abcd_prd"),
        ("SFCC_SITE_ID", "site_id", "RefArch"),
        ("SFCC_SLAS_CLIENT_ID", "slas_client_id", "slas-client"),
        ("SFCC_SLAS_CLIENT_SECRET", "slas_client_secret", "slas-secret"),
        ("SFCC_ACCOUNT_MANAGER_HOST", "account_manager_host", "account.demandware.com"),
        ("SFCC_SANDBOX_API_HOST", "sandbox_api_host", "admin.dx.commercecloud.salesforce.com"),
        ("SFCC_CIP_HOST", "cip_host", "cip.example.com"),
    ],
)
def test_maps_string_env_var_to_field(env_var: str, field: str, value: str) -> None:
    source = EnvSource({env_var: value})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert getattr(result.config, field) == value


def test_sfcc_shortcode_takes_precedence_over_sfcc_short_code_when_both_set() -> None:
    source = EnvSource({"SFCC_SHORT_CODE": "legacy-code", "SFCC_SHORTCODE": "canonical-code"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.short_code == "canonical-code"


# --- apiBackend (SFCC_API_BACKEND) --------------------------------------------------


@pytest.mark.parametrize("value", ["auto", "scapi", "ocapi"])
def test_maps_sfcc_api_backend_to_api_backend(value: str) -> None:
    source = EnvSource({"SFCC_API_BACKEND": value})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.api_backend == value


def test_ignores_an_invalid_sfcc_api_backend_value() -> None:
    source = EnvSource({"SFCC_API_BACKEND": "bogus"})
    result = source.load(ResolveConfigOptions())
    # No valid fields -> source contributes nothing.
    assert result is None


def test_ignores_an_invalid_value_but_keeps_other_valid_env_fields() -> None:
    source = EnvSource({"SFCC_API_BACKEND": "bogus", "SFCC_SERVER": "test.demandware.net"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.api_backend is None
    assert result.config.hostname == "test.demandware.net"


# --- boolean parsing -----------------------------------------------------------------


@pytest.mark.parametrize(
    ("value", "expected"),
    [("true", True), ("1", True), ("false", False), ("0", False)],
)
def test_parses_sfcc_selfsigned_boolean(value: str, expected: bool) -> None:
    source = EnvSource({"SFCC_SELFSIGNED": value})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.self_signed is expected


# --- array parsing -------------------------------------------------------------------


def test_parses_import_set_directory_exclusions() -> None:
    source = EnvSource({"SFCC_IMPORT_SET_EXCLUDE": "fixtures, test/integration"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.import_set_exclude == ["fixtures", "test/integration"]


def test_parses_sfcc_oauth_scopes_as_comma_separated_array() -> None:
    source = EnvSource({"SFCC_OAUTH_SCOPES": "mail,roles,openid"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.scopes == ["mail", "roles", "openid"]


def test_trims_whitespace_in_comma_separated_values() -> None:
    source = EnvSource({"SFCC_OAUTH_SCOPES": " mail , roles , openid "})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.scopes == ["mail", "roles", "openid"]


def test_filters_empty_values_in_comma_separated_arrays() -> None:
    source = EnvSource({"SFCC_OAUTH_SCOPES": "mail,,roles,"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.scopes == ["mail", "roles"]


def test_parses_sfcc_auth_methods_as_comma_separated_array() -> None:
    source = EnvSource({"SFCC_AUTH_METHODS": "client-credentials,implicit"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.auth_methods == ["client-credentials", "implicit"]


# --- empty/undefined handling ---------------------------------------------------------


def test_returns_none_when_no_supported_environment_variables_are_set() -> None:
    source = EnvSource({})
    result = source.load(ResolveConfigOptions())
    assert result is None


def test_skips_empty_string_values() -> None:
    source = EnvSource({"SFCC_SERVER": "", "SFCC_CLIENT_ID": "my-client"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.hostname is None
    assert result.config.client_id == "my-client"


def test_skips_missing_values() -> None:
    # Mirrors the TS "skips undefined values" case: the var is simply absent.
    source = EnvSource({"SFCC_CLIENT_ID": "my-client"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.hostname is None
    assert result.config.client_id == "my-client"


def test_ignores_non_sfcc_environment_variables() -> None:
    source = EnvSource({"HOME": "/home/user", "PATH": "/usr/bin", "SFCC_SERVER": "test.demandware.net"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.hostname == "test.demandware.net"
    populated = [f.name for f in dataclasses.fields(result.config) if getattr(result.config, f.name) is not None]
    assert len(populated) == 1


# --- metadata -------------------------------------------------------------------------


def test_has_name_env_source() -> None:
    source = EnvSource({})
    assert source.name == "EnvSource"


def test_has_priority_minus_10() -> None:
    source = EnvSource({})
    assert source.priority == -10


def test_reports_location_as_environment_variables() -> None:
    source = EnvSource({"SFCC_SERVER": "test.demandware.net"})
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.location == "environment variables"


# --- integration with ConfigResolver ---------------------------------------------------


def _write_dw_json(directory: Path, data: object) -> None:
    (directory / "dw.json").write_text(json.dumps(data), encoding="utf-8")


async def test_env_source_overrides_dw_json_source_values(tmp_path: Path) -> None:
    # priority -10 < 0 -> EnvSource wins.
    _write_dw_json(tmp_path, {"hostname": "dw.demandware.net"})

    env_source = EnvSource({"SFCC_SERVER": "env.demandware.net"})
    resolver = ConfigResolver([env_source, DwJsonSource()])
    result = await resolver.resolve(options=ResolveConfigOptions(project_directory=str(tmp_path)))

    assert result.config.hostname == "env.demandware.net"


async def test_dw_json_source_fills_gaps_not_covered_by_env_source(tmp_path: Path) -> None:
    _write_dw_json(tmp_path, {"hostname": "dw.demandware.net", "code-version": "v2"})

    env_source = EnvSource({"SFCC_SERVER": "env.demandware.net"})
    resolver = ConfigResolver([env_source, DwJsonSource()])
    result = await resolver.resolve(options=ResolveConfigOptions(project_directory=str(tmp_path)))

    assert result.config.hostname == "env.demandware.net"
    assert result.config.code_version == "v2"


# --- defaults to process.env ----------------------------------------------------------


def test_reads_from_process_env_when_no_env_param_given(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SFCC_SERVER", "from-process-env.demandware.net")
    source = EnvSource()
    result = source.load(ResolveConfigOptions())
    assert result is not None
    assert result.config.hostname == "from-process-env.demandware.net"
