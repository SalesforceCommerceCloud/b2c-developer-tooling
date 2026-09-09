# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for dw.json configuration loading (mirrors the TS ``config/dw-json`` suite)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from b2c_tooling_sdk.config.dw_json import (
    DwJsonMultiConfig,
    add_instance,
    find_dw_json,
    load_dw_json,
    load_full_dw_json,
    remove_instance,
    save_dw_json,
    set_active_instance,
)


@pytest.fixture(autouse=True)
def _cwd(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Run each test with cwd set to an isolated temp directory (mirrors process.chdir in TS)."""
    monkeypatch.chdir(tmp_path)
    return tmp_path


def _write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data), encoding="utf-8")


# --- find_dw_json --------------------------------------------------------------


def test_find_dw_json_returns_none_when_no_dw_json_exists(tmp_path: Path) -> None:
    assert find_dw_json() is None


def test_find_dw_json_finds_dw_json_in_current_directory(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"hostname": "test.demandware.net"})

    result = find_dw_json(str(tmp_path))

    assert result is not None
    assert Path(result) == dw_json_path.resolve()


def test_find_dw_json_finds_dw_json_in_parent_directory(tmp_path: Path) -> None:
    sub_dir = tmp_path / "subdir"
    sub_dir.mkdir()
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"hostname": "test.demandware.net"})

    result = find_dw_json(str(sub_dir))

    assert result is not None
    assert Path(result) == dw_json_path.resolve()


def test_find_dw_json_stops_at_filesystem_root(tmp_path: Path) -> None:
    root = Path(tmp_path.resolve().anchor)
    if (root / "dw.json").exists():
        pytest.skip("filesystem root unexpectedly has a dw.json")

    result = find_dw_json(str(root))

    assert result is None


# --- load_dw_json ----------------------------------------------------------------


def test_load_dw_json_returns_none_when_no_dw_json_exists() -> None:
    assert load_dw_json() is None


def test_load_dw_json_loads_basic_config(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "hostname": "test.demandware.net",
            "code-version": "v1",
            "username": "test-user",
            "password": "test-pass",
        },
    )

    result = load_dw_json()

    assert result is not None
    # Keys are normalized to camelCase.
    assert result.config["hostname"] == "test.demandware.net"
    assert result.config["codeVersion"] == "v1"
    assert result.config["username"] == "test-user"
    assert result.config["password"] == "test-pass"


def test_load_dw_json_loads_config_from_explicit_path(tmp_path: Path) -> None:
    custom_path = tmp_path / "custom-dw.json"
    _write_json(custom_path, {"hostname": "custom.demandware.net"})

    result = load_dw_json(path=str(custom_path))

    assert result is not None
    assert result.config["hostname"] == "custom.demandware.net"


def test_load_dw_json_selects_named_instance_from_multi_config(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "hostname": "root.demandware.net",
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ],
        },
    )

    result = load_dw_json(instance="staging")

    assert result is not None
    assert result.config["hostname"] == "staging.demandware.net"
    assert result.config["name"] == "staging"


def test_load_dw_json_returns_none_when_requested_instance_does_not_exist(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "hostname": "root.demandware.net",
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ],
        },
    )

    result = load_dw_json(instance="nonexistent")

    assert result is None


def test_load_dw_json_selects_active_config_when_no_instance_specified(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "active": False,
            "hostname": "root.demandware.net",
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net", "active": False},
                {"name": "production", "hostname": "prod.demandware.net", "active": True},
            ],
        },
    )

    result = load_dw_json()

    assert result is not None
    assert result.config["hostname"] == "prod.demandware.net"
    assert result.config["name"] == "production"


def test_load_dw_json_selects_active_config_when_root_has_no_active_field(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "configs": [
                {"name": "sandbox1", "hostname": "sandbox1.demandware.net", "active": True},
                {"name": "sandbox2", "hostname": "sandbox2.demandware.net"},
            ],
        },
    )

    result = load_dw_json()

    assert result is not None
    assert result.config["hostname"] == "sandbox1.demandware.net"
    assert result.config["name"] == "sandbox1"


def test_load_dw_json_returns_root_config_when_no_active_config_found(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "active": True,
            "hostname": "root.demandware.net",
            "configs": [{"name": "staging", "hostname": "staging.demandware.net", "active": False}],
        },
    )

    result = load_dw_json()

    assert result is not None
    assert result.config["hostname"] == "root.demandware.net"


def test_load_dw_json_raises_for_invalid_json(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    dw_json_path.write_text("invalid json", encoding="utf-8")

    with pytest.raises(json.JSONDecodeError):
        load_dw_json()


def test_load_dw_json_returns_none_for_nonexistent_explicit_path() -> None:
    result = load_dw_json(path="/nonexistent/dw.json")

    assert result is None


def test_load_dw_json_handles_oauth_credentials_kebab_case(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "hostname": "test.demandware.net",
            "client-id": "test-client",
            "client-secret": "test-secret",
            "oauth-scopes": ["mail", "roles"],
        },
    )

    result = load_dw_json()

    assert result is not None
    # Kebab-case keys are normalized to camelCase.
    assert result.config["clientId"] == "test-client"
    assert result.config["clientSecret"] == "test-secret"
    assert result.config["oauthScopes"] == ["mail", "roles"]


def test_load_dw_json_handles_oauth_credentials_camel_case(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "hostname": "test.demandware.net",
            "clientId": "test-client",
            "clientSecret": "test-secret",
            "oauthScopes": ["mail", "roles"],
        },
    )

    result = load_dw_json()

    assert result is not None
    assert result.config["clientId"] == "test-client"
    assert result.config["clientSecret"] == "test-secret"
    assert result.config["oauthScopes"] == ["mail", "roles"]


def test_load_dw_json_handles_webdav_hostname(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "hostname": "test.demandware.net",
            "webdav-hostname": "webdav.test.com",
        },
    )

    result = load_dw_json()

    assert result is not None
    # webdav-hostname normalizes to webdavHostname.
    assert result.config["webdavHostname"] == "webdav.test.com"


def test_load_dw_json_normalizes_configs_array_items(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "configs": [
                {
                    "name": "staging",
                    "hostname": "staging.demandware.net",
                    "client-id": "staging-client",
                    "code-version": "v2",
                }
            ],
        },
    )

    result = load_dw_json(instance="staging")

    assert result is not None
    assert result.config["clientId"] == "staging-client"
    assert result.config["codeVersion"] == "v2"


def test_load_dw_json_normalizes_legacy_aliases(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "server": "test.demandware.net",
            "secureHostname": "webdav.test.com",
            "passphrase": "cert-pass",
            "selfsigned": True,
            "cloudOrigin": "https://cloud.example.com",
            "scapi-shortcode": "abc123",
        },
    )

    result = load_dw_json()

    assert result is not None
    assert result.config["hostname"] == "test.demandware.net"
    assert result.config["webdavHostname"] == "webdav.test.com"
    assert result.config["certificatePassphrase"] == "cert-pass"
    assert result.config["selfSigned"] is True
    assert result.config["mrtOrigin"] == "https://cloud.example.com"
    assert result.config["shortCode"] == "abc123"


# --- load_full_dw_json -----------------------------------------------------------


def test_load_full_dw_json_returns_none_when_no_dw_json_exists() -> None:
    assert load_full_dw_json() is None


def test_load_full_dw_json_loads_the_full_multi_config_structure(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    multi_config: DwJsonMultiConfig = {
        "hostname": "root.demandware.net",
        "configs": [
            {"name": "staging", "hostname": "staging.demandware.net"},
            {"name": "production", "hostname": "prod.demandware.net"},
        ],
    }
    _write_json(dw_json_path, multi_config)

    result = load_full_dw_json()

    assert result is not None
    assert result.config == multi_config
    assert len(result.config["configs"]) == 2


# --- save_dw_json ------------------------------------------------------------------


def test_save_dw_json_writes_config_to_file(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    config: DwJsonMultiConfig = {
        "hostname": "test.demandware.net",
        "configs": [{"name": "staging", "hostname": "staging.demandware.net"}],
    }

    save_dw_json(config, str(dw_json_path))

    content = dw_json_path.read_text(encoding="utf-8")
    assert json.loads(content) == config


def test_save_dw_json_formats_with_2_space_indentation_and_trailing_newline(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    config: DwJsonMultiConfig = {"hostname": "test.demandware.net"}

    save_dw_json(config, str(dw_json_path))

    content = dw_json_path.read_text(encoding="utf-8")
    assert content.startswith("{")
    assert content.endswith("}\n")
    assert '  "hostname"' in content


# --- add_instance ------------------------------------------------------------------


def test_add_instance_creates_dw_json_if_it_does_not_exist(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    assert not dw_json_path.exists()

    add_instance({"name": "staging", "hostname": "staging.demandware.net"})

    assert dw_json_path.exists()
    result = load_full_dw_json()
    assert result is not None
    assert len(result.config["configs"]) == 1
    assert result.config["configs"][0]["name"] == "staging"


def test_add_instance_adds_instance_to_existing_configs_array(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {"configs": [{"name": "production", "hostname": "prod.demandware.net"}]},
    )

    add_instance({"name": "staging", "hostname": "staging.demandware.net"})

    result = load_full_dw_json()
    assert result is not None
    assert len(result.config["configs"]) == 2
    assert result.config["configs"][1]["name"] == "staging"


def test_add_instance_raises_if_instance_already_exists_in_configs_array(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {"configs": [{"name": "staging", "hostname": "staging.demandware.net"}]},
    )

    with pytest.raises(ValueError, match="already exists"):
        add_instance({"name": "staging", "hostname": "new.demandware.net"})


def test_add_instance_raises_if_instance_name_matches_root_config_name(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"name": "staging", "hostname": "staging.demandware.net"})

    with pytest.raises(ValueError, match="already exists"):
        add_instance({"name": "staging", "hostname": "new.demandware.net"})


def test_add_instance_raises_if_instance_has_no_name() -> None:
    with pytest.raises(ValueError, match="must have a name"):
        add_instance({"hostname": "test.demandware.net"})


def test_add_instance_sets_instance_as_active_and_clears_other_active_flags(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "active": True,
            "hostname": "root.demandware.net",
            "configs": [{"name": "production", "hostname": "prod.demandware.net", "active": True}],
        },
    )

    add_instance({"name": "staging", "hostname": "staging.demandware.net"}, set_active=True)

    result = load_full_dw_json()
    assert result is not None
    assert result.config["active"] is False
    assert result.config["configs"][0]["active"] is False
    assert result.config["configs"][1]["active"] is True


# --- remove_instance -----------------------------------------------------------------


def test_remove_instance_removes_instance_from_configs_array(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ],
        },
    )

    remove_instance("staging")

    result = load_full_dw_json()
    assert result is not None
    assert len(result.config["configs"]) == 1
    assert result.config["configs"][0]["name"] == "production"


def test_remove_instance_raises_if_dw_json_does_not_exist() -> None:
    with pytest.raises(FileNotFoundError, match="No dw.json file found"):
        remove_instance("staging")


def test_remove_instance_raises_if_instance_not_found(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"configs": [{"name": "production", "hostname": "prod.demandware.net"}]})

    with pytest.raises(ValueError, match="not found"):
        remove_instance("staging")


def test_remove_instance_raises_if_trying_to_remove_root_config(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"name": "staging", "hostname": "staging.demandware.net"})

    with pytest.raises(ValueError, match="Cannot remove root instance"):
        remove_instance("staging")


# --- set_active_instance -------------------------------------------------------------


def test_set_active_instance_sets_instance_as_active_in_configs_array(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ],
        },
    )

    set_active_instance("staging")

    result = load_full_dw_json()
    assert result is not None
    assert result.config["configs"][0]["active"] is True
    assert "active" not in result.config["configs"][1]


def test_set_active_instance_sets_root_config_as_active(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "name": "root",
            "hostname": "root.demandware.net",
            "configs": [{"name": "staging", "hostname": "staging.demandware.net", "active": True}],
        },
    )

    set_active_instance("root")

    result = load_full_dw_json()
    assert result is not None
    assert result.config["active"] is True
    assert result.config["configs"][0]["active"] is False


def test_set_active_instance_clears_other_active_flags_when_setting_new_active(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(
        dw_json_path,
        {
            "active": True,
            "hostname": "root.demandware.net",
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net", "active": True},
                {"name": "production", "hostname": "prod.demandware.net"},
            ],
        },
    )

    set_active_instance("production")

    result = load_full_dw_json()
    assert result is not None
    assert result.config["active"] is False
    assert result.config["configs"][0]["active"] is False
    assert result.config["configs"][1]["active"] is True


def test_set_active_instance_raises_if_dw_json_does_not_exist() -> None:
    with pytest.raises(FileNotFoundError, match="No dw.json file found"):
        set_active_instance("staging")


def test_set_active_instance_raises_if_instance_not_found(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"configs": [{"name": "production", "hostname": "prod.demandware.net"}]})

    with pytest.raises(ValueError, match="not found"):
        set_active_instance("staging")
