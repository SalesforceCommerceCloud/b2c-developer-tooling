# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared user-level B2C settings (``settings.json``).

Mirrors ``src/config/settings.ts``. Reads/writes the same ``settings.json`` in
the oclif *config* directory used by the B2C CLI, MCP server, and SDK consumers,
so a ``defaultConfigPath`` set by one tool is visible to the others.

Config directory resolution:
``$B2C_CONFIG_DIR | $XDG_CONFIG_HOME | (win32 %LOCALAPPDATA%) | ~/.config`` then
``/b2c``.
"""

from __future__ import annotations

import contextlib
import json as json_module
import os
import sys
from pathlib import Path
from typing import Any

from b2c_tooling_sdk.logging import get_logger

B2C_SETTINGS_FILENAME = "settings.json"


def get_b2c_config_directory(
    *,
    config_directory: str | None = None,
    environment: dict[str, str] | None = None,
    home_directory: str | None = None,
    platform: str | None = None,
) -> str:
    """Resolve the shared oclif-compatible B2C configuration directory."""
    if config_directory:
        return str(Path(config_directory).resolve())

    env = environment if environment is not None else dict(os.environ)
    home = home_directory or str(Path.home())
    plat = platform or sys.platform

    base_directory = (
        env.get("B2C_CONFIG_DIR")
        or env.get("XDG_CONFIG_HOME")
        or (env.get("LOCALAPPDATA") if plat == "win32" else None)
        or os.path.join(home, ".config")
    )
    return os.path.join(base_directory, "b2c")


def get_b2c_settings_path(
    *,
    config_directory: str | None = None,
    environment: dict[str, str] | None = None,
    home_directory: str | None = None,
    platform: str | None = None,
) -> str:
    """Resolve the shared ``settings.json`` path."""
    return os.path.join(
        get_b2c_config_directory(
            config_directory=config_directory,
            environment=environment,
            home_directory=home_directory,
            platform=platform,
        ),
        B2C_SETTINGS_FILENAME,
    )


def read_b2c_settings(
    *,
    config_directory: str | None = None,
    environment: dict[str, str] | None = None,
    home_directory: str | None = None,
    platform: str | None = None,
) -> dict[str, Any]:
    """Read shared B2C settings. Missing or invalid files are treated as unset.

    A relative ``defaultConfigPath`` is resolved against the settings directory;
    a non-string/empty value is dropped with a warning.
    """
    settings_path = get_b2c_settings_path(
        config_directory=config_directory,
        environment=environment,
        home_directory=home_directory,
        platform=platform,
    )
    if not os.path.exists(settings_path):
        return {}

    try:
        with open(settings_path, encoding="utf-8") as fh:
            parsed: dict[str, Any] = json_module.load(fh)
    except Exception as error:
        get_logger("config.settings").warning("[Config] Failed to read B2C settings %s: %s", settings_path, error)
        return {}

    default_config_path = parsed.get("defaultConfigPath")
    if default_config_path is None:
        return parsed
    if not isinstance(default_config_path, str) or default_config_path.strip() == "":
        get_logger("config.settings").warning(
            "[Config] Ignoring invalid defaultConfigPath in B2C settings %s", settings_path
        )
        parsed.pop("defaultConfigPath", None)
        return parsed

    if not os.path.isabs(default_config_path):
        parsed["defaultConfigPath"] = str(Path(os.path.dirname(settings_path), default_config_path).resolve())
    return parsed


def write_b2c_settings(
    settings: dict[str, Any],
    *,
    config_directory: str | None = None,
    environment: dict[str, str] | None = None,
    home_directory: str | None = None,
    platform: str | None = None,
) -> None:
    """Write shared B2C settings atomically (mode 0o600, trailing newline)."""
    settings_path = get_b2c_settings_path(
        config_directory=config_directory,
        environment=environment,
        home_directory=home_directory,
        platform=platform,
    )
    config_dir = os.path.dirname(settings_path)
    temporary_path = f"{settings_path}.{os.getpid()}.tmp"
    os.makedirs(config_dir, exist_ok=True)
    content = json_module.dumps(settings, indent=2) + "\n"
    fd = os.open(temporary_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(content)
    except Exception:
        with contextlib.suppress(OSError):
            os.unlink(temporary_path)
        raise
    os.replace(temporary_path, settings_path)


__all__ = [
    "B2C_SETTINGS_FILENAME",
    "get_b2c_config_directory",
    "get_b2c_settings_path",
    "read_b2c_settings",
    "write_b2c_settings",
]
