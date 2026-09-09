# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for config/mapping (mirrors the TS ``config/mapping`` suite)."""

from __future__ import annotations

import pytest

from b2c_tooling_sdk.config.mapping import (
    CONFIG_KEY_ALIASES,
    kebab_to_camel_case,
    map_dw_json_to_normalized_config,
    normalize_config_keys,
    normalize_origin_url,
    resolve_library_entries,
)
from b2c_tooling_sdk.config.types import LibraryEntry

# --- kebab_to_camel_case ---------------------------------------------------------


def test_kebab_to_camel_case_converts_kebab_case_to_camel_case() -> None:
    assert kebab_to_camel_case("code-version") == "codeVersion"
    assert kebab_to_camel_case("client-id") == "clientId"
    assert kebab_to_camel_case("sandbox-api-host") == "sandboxApiHost"
    assert kebab_to_camel_case("account-manager-host") == "accountManagerHost"


def test_kebab_to_camel_case_passes_through_already_camel_case_strings_unchanged() -> None:
    assert kebab_to_camel_case("hostname") == "hostname"
    assert kebab_to_camel_case("shortCode") == "shortCode"
    assert kebab_to_camel_case("mrtProject") == "mrtProject"


def test_kebab_to_camel_case_handles_multi_segment_kebab_case() -> None:
    assert kebab_to_camel_case("certificate-passphrase") == "certificatePassphrase"
    assert kebab_to_camel_case("webdav-hostname") == "webdavHostname"


# --- resolve_library_entries ------------------------------------------------------


def test_resolve_library_entries_returns_empty_list_for_none() -> None:
    assert resolve_library_entries(None) == []


def test_resolve_library_entries_treats_bare_strings_as_shared_libraries() -> None:
    assert resolve_library_entries(["RefArch", "OtherLib"]) == [
        LibraryEntry(id="RefArch", site_library=False),
        LibraryEntry(id="OtherLib", site_library=False),
    ]


def test_resolve_library_entries_passes_through_entries_and_defaults_site_library_to_false() -> None:
    entries = [LibraryEntry(id="shared"), LibraryEntry(id="private", site_library=True)]
    assert resolve_library_entries(entries) == [
        LibraryEntry(id="shared", site_library=False),
        LibraryEntry(id="private", site_library=True),
    ]


def test_resolve_library_entries_supports_mixed_string_and_entry_values_in_the_same_list() -> None:
    result = resolve_library_entries(["RefArch", LibraryEntry(id="homepage", site_library=True)])
    assert result == [
        LibraryEntry(id="RefArch", site_library=False),
        LibraryEntry(id="homepage", site_library=True),
    ]


# --- CONFIG_KEY_ALIASES ------------------------------------------------------------


def test_config_key_aliases_maps_server_to_hostname() -> None:
    assert CONFIG_KEY_ALIASES["server"] == "hostname"


def test_config_key_aliases_maps_scapi_shortcode_to_short_code() -> None:
    assert CONFIG_KEY_ALIASES["scapi-shortcode"] == "shortCode"


def test_config_key_aliases_maps_webdav_aliases_to_webdav_hostname() -> None:
    assert CONFIG_KEY_ALIASES["webdav-server"] == "webdavHostname"
    assert CONFIG_KEY_ALIASES["secure-server"] == "webdavHostname"
    assert CONFIG_KEY_ALIASES["secureHostname"] == "webdavHostname"


def test_config_key_aliases_maps_legacy_tls_cert_aliases() -> None:
    assert CONFIG_KEY_ALIASES["passphrase"] == "certificatePassphrase"
    assert CONFIG_KEY_ALIASES["selfsigned"] == "selfSigned"


def test_config_key_aliases_maps_cloud_origin_to_mrt_origin() -> None:
    assert CONFIG_KEY_ALIASES["cloudOrigin"] == "mrtOrigin"


def test_config_key_aliases_maps_oauth_scopes_to_oauth_scopes() -> None:
    assert CONFIG_KEY_ALIASES["oauth-scopes"] == "oauthScopes"


# --- normalize_config_keys --------------------------------------------------------


def test_normalize_config_keys_converts_kebab_case_keys_to_camel_case() -> None:
    result = normalize_config_keys({"client-id": "abc", "code-version": "v1", "tenant-id": "org_123"})
    assert result == {"clientId": "abc", "codeVersion": "v1", "tenantId": "org_123"}


def test_normalize_config_keys_passes_through_camel_case_keys_unchanged() -> None:
    result = normalize_config_keys({"hostname": "test.com", "shortCode": "abc", "mrtProject": "proj"})
    assert result == {"hostname": "test.com", "shortCode": "abc", "mrtProject": "proj"}


def test_normalize_config_keys_resolves_legacy_aliases() -> None:
    result = normalize_config_keys(
        {
            "server": "test.com",
            "passphrase": "secret",
            "selfsigned": True,
            "cloudOrigin": "https://cloud.example.com",
            "scapi-shortcode": "abc",
        }
    )
    assert result == {
        "hostname": "test.com",
        "certificatePassphrase": "secret",
        "selfSigned": True,
        "mrtOrigin": "https://cloud.example.com",
        "shortCode": "abc",
    }


def test_normalize_config_keys_first_value_wins_when_multiple_keys_resolve_to_same_canonical_name() -> None:
    # Both 'server' (alias) and 'hostname' (canonical) resolve to 'hostname'.
    # In dict iteration order, 'server' comes first.
    result = normalize_config_keys({"server": "first.com", "hostname": "second.com"})
    assert result["hostname"] == "first.com"


def test_normalize_config_keys_skips_none_values() -> None:
    # Mirrors the TS `undefined` skip: None-valued keys are dropped entirely so an
    # absent key never shadows a later alias resolving to the same canonical name.
    result = normalize_config_keys({"hostname": "test.com", "client-id": None})
    assert result == {"hostname": "test.com"}
    assert "clientId" not in result


def test_normalize_config_keys_none_does_not_shadow_later_alias() -> None:
    # `server` and `hostname` both canonicalize to `hostname`; a None first value
    # must not claim the slot and block the real value.
    result = normalize_config_keys({"server": None, "hostname": "real.com"})
    assert result == {"hostname": "real.com"}


def test_normalize_config_keys_handles_mixed_kebab_case_and_camel_case_input() -> None:
    result = normalize_config_keys(
        {
            "hostname": "test.com",
            "client-id": "abc",
            "clientSecret": "xyz",
            "code-version": "v1",
            "mrtProject": "proj",
        }
    )
    assert result == {
        "hostname": "test.com",
        "clientId": "abc",
        "clientSecret": "xyz",
        "codeVersion": "v1",
        "mrtProject": "proj",
    }


def test_normalize_config_keys_handles_empty_dict() -> None:
    assert normalize_config_keys({}) == {}


def test_normalize_config_keys_normalizes_cloud_origin_bare_hostname_via_alias_without_touching_value() -> None:
    result = normalize_config_keys({"cloudOrigin": "cloud-staging.mobify.com"})
    # normalize_config_keys only does key aliasing, not value normalization.
    assert result["mrtOrigin"] == "cloud-staging.mobify.com"


def test_normalize_config_keys_preserves_non_string_values() -> None:
    result = normalize_config_keys(
        {
            "oauth-scopes": ["mail", "roles"],
            "self-signed": True,
            "auth-methods": ["client-credentials", "implicit"],
        }
    )
    assert result["oauthScopes"] == ["mail", "roles"]
    assert result["selfSigned"] is True
    assert result["authMethods"] == ["client-credentials", "implicit"]


# --- normalize_origin_url ----------------------------------------------------------


def test_normalize_origin_url_returns_none_for_none_input() -> None:
    assert normalize_origin_url(None) is None


def test_normalize_origin_url_returns_none_for_empty_string() -> None:
    assert normalize_origin_url("") is None


def test_normalize_origin_url_adds_https_to_bare_hostname() -> None:
    assert normalize_origin_url("cloud.mobify.com") == "https://cloud.mobify.com"


def test_normalize_origin_url_preserves_existing_https_prefix() -> None:
    assert normalize_origin_url("https://cloud.mobify.com") == "https://cloud.mobify.com"


def test_normalize_origin_url_preserves_existing_http_prefix() -> None:
    assert normalize_origin_url("http://localhost:3000") == "http://localhost:3000"


def test_normalize_origin_url_strips_trailing_slashes() -> None:
    assert normalize_origin_url("https://cloud.mobify.com/") == "https://cloud.mobify.com"
    assert normalize_origin_url("cloud.mobify.com/") == "https://cloud.mobify.com"


# --- map_dw_json_to_normalized_config - userAuth shorthand -------------------------


def test_map_dw_json_to_normalized_config_collapses_user_auth_true_to_auth_methods_user() -> None:
    result = map_dw_json_to_normalized_config({"userAuth": True})
    assert result.auth_methods == ["user"]


def test_map_dw_json_to_normalized_config_passes_through_auth_methods_when_user_auth_is_unset() -> None:
    result = map_dw_json_to_normalized_config({"authMethods": ["client-credentials", "jwt"]})
    assert result.auth_methods == ["client-credentials", "jwt"]


def test_map_dw_json_to_normalized_config_does_not_set_auth_methods_when_user_auth_is_false() -> None:
    result = map_dw_json_to_normalized_config({"userAuth": False})
    assert result.auth_methods is None


def test_map_dw_json_to_normalized_config_raises_when_both_user_auth_and_auth_methods_are_set() -> None:
    with pytest.raises(ValueError, match="mutually exclusive"):
        map_dw_json_to_normalized_config({"userAuth": True, "authMethods": ["user"]})
