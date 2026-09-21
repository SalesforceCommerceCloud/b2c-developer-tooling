# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for config/redaction (mirrors the TS ``config redaction`` suite)."""

from __future__ import annotations

from b2c_tooling_sdk.config.redaction import (
    SENSITIVE_CONFIG_FIELDS,
    is_sensitive_config_field,
    mask_config_value,
    redact_config_values,
)
from b2c_tooling_sdk.config.types import NormalizedConfig

# --- is_sensitive_config_field ------------------------------------------------------


def test_flags_known_secret_fields() -> None:
    assert is_sensitive_config_field("password") is True
    assert is_sensitive_config_field("client_secret") is True
    assert is_sensitive_config_field("mrt_api_key") is True
    assert is_sensitive_config_field("slas_client_secret") is True
    assert is_sensitive_config_field("certificate_passphrase") is True
    assert is_sensitive_config_field("jwt_passphrase") is True


def test_does_not_flag_non_secret_fields() -> None:
    assert is_sensitive_config_field("hostname") is False
    assert is_sensitive_config_field("client_id") is False


# --- mask_config_value --------------------------------------------------------------


def test_shows_the_first_4_characters_of_long_values() -> None:
    assert mask_config_value("super-secret-value") == "supe...REDACTED"


def test_fully_redacts_short_values() -> None:
    assert mask_config_value("short") == "REDACTED"
    # 10 chars is the boundary -- still fully redacted.
    assert mask_config_value("1234567890") == "REDACTED"


# --- redact_config_values ------------------------------------------------------------


def test_masks_secrets_and_passes_through_non_secrets_by_default() -> None:
    result = redact_config_values(
        NormalizedConfig(
            hostname="example.demandware.net",
            client_id="aaaa-bbbb",
            client_secret="super-secret-value-1234",
            password="my-web-dav-password",
        )
    )

    assert result["hostname"] == "example.demandware.net"
    assert result["client_id"] == "aaaa-bbbb"
    assert result["client_secret"] == "supe...REDACTED"
    assert result["password"] == "my-w...REDACTED"


def test_leaves_secrets_untouched_when_unmask_is_true() -> None:
    result = redact_config_values(NormalizedConfig(client_secret="super-secret-value-1234"), unmask=True)
    assert result["client_secret"] == "super-secret-value-1234"


def test_omits_none_values() -> None:
    result = redact_config_values(NormalizedConfig(hostname="example.demandware.net"))
    assert "hostname" in result
    assert "code_version" not in result


def test_exports_a_stable_set_of_sensitive_fields() -> None:
    assert "password" in SENSITIVE_CONFIG_FIELDS
