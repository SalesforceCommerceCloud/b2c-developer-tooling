# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for config/settings (mirrors the shared B2C settings portion of the TS
``config/settings`` suite; ``readProjectEnvironment``/``mergeProjectEnvironment``
live in a separate ``project_environment`` module and are out of scope here).
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from b2c_tooling_sdk.config.settings import (
    get_b2c_config_directory,
    get_b2c_settings_path,
    read_b2c_settings,
    write_b2c_settings,
)


def test_uses_the_oclif_compatible_b2c_config_directory(tmp_path: Path) -> None:
    result = get_b2c_config_directory(
        environment={"XDG_CONFIG_HOME": str(tmp_path)},
        home_directory=str(tmp_path / "home"),
        platform="linux",
    )
    assert result == os.path.join(str(tmp_path), "b2c")


def test_writes_and_reads_the_default_config_path_while_preserving_other_settings(tmp_path: Path) -> None:
    config_directory = str(tmp_path / "config")
    default_config_path = str(tmp_path / "shared.dw.json")

    write_b2c_settings(
        {"defaultConfigPath": default_config_path, "futureSetting": True}, config_directory=config_directory
    )

    assert read_b2c_settings(config_directory=config_directory) == {
        "defaultConfigPath": default_config_path,
        "futureSetting": True,
    }
    settings_path = get_b2c_settings_path(config_directory=config_directory)
    with open(settings_path, encoding="utf-8") as fh:
        assert json.load(fh) == {"defaultConfigPath": default_config_path, "futureSetting": True}


def test_resolves_a_relative_default_path_from_the_settings_directory(tmp_path: Path) -> None:
    config_directory = str(tmp_path / "config")
    os.makedirs(config_directory, exist_ok=True)
    settings_path = get_b2c_settings_path(config_directory=config_directory)
    with open(settings_path, "w", encoding="utf-8") as fh:
        json.dump({"defaultConfigPath": "shared.dw.json"}, fh)

    result = read_b2c_settings(config_directory=config_directory)

    assert result["defaultConfigPath"] == os.path.join(config_directory, "shared.dw.json")


def test_write_b2c_settings_creates_the_config_directory_and_sets_file_mode(tmp_path: Path) -> None:
    config_directory = str(tmp_path / "nested" / "config")

    write_b2c_settings({"defaultConfigPath": "shared.dw.json"}, config_directory=config_directory)

    settings_path = get_b2c_settings_path(config_directory=config_directory)
    assert os.path.exists(settings_path)
    mode = os.stat(settings_path).st_mode & 0o777
    assert mode == 0o600
    content = Path(settings_path).read_text(encoding="utf-8")
    assert content.endswith("\n")


def test_read_b2c_settings_returns_empty_dict_when_no_settings_file_exists(tmp_path: Path) -> None:
    config_directory = str(tmp_path / "config")
    assert read_b2c_settings(config_directory=config_directory) == {}
